/* jshint node: true */
'use strict';

var uuid = require('uuid');
var WriteLock = require('./writelock');

function Channel(signaller, targetId, opts) {
  if (! (this instanceof Channel)) {
    return new Channel(signaller, targetId);
  }

  // save the signaller for internal use
  this.signaller = signaller;

  // initialise the source and target id
  this.sourceId = signaller.id;
  this.targetId = targetId;

  // initialise the channel id
  this.id = [signaller.id, targetId].sort().join(':');

  // initialise the ping timeout
  this.pingtimeout = (opts || {}).pingtimeout || 1000;

  // initialise the writelock to null
  this.lock = null;

  // create bound handlers
  this._handleWriteLock = handleWriteLock.bind(this);
  this._handleReleaseLock = handleReleaseLock.bind(this);
  this._handlePing = handlePing.bind(this);

  // handle lock messages
  this.signaller.on('writelock', this._handleWriteLock);
  this.signaller.on('writelock:release', this._handleReleaseLock);
  this.signaller.on('ping', this._handlePing);
}

module.exports = Channel;

Channel.prototype.ping = function(callback) {
  var signaller = this.signaller;
  var testId = uuid.v4();
  var pingTimeout = 0;

  this.send('/ping', testId);
  this.signaller.once('pong:' + testId, function(srcId) {
    clearTimeout(pingTimeout);
    callback();
  });

  pingTimeout = setTimeout(function() {
    signaller.removeAllListeners('pong:' + testId);
    callback(new Error('ping timed out'));
  }, this.pingtimeout);
};

Channel.prototype.send = function(command) {
  var payload = [].slice.call(arguments, 1);

  return this.signaller.send.apply(
    this.signaller,
    ['/to', this.targetId, command, this.sourceId].concat(payload)
  );
};

Channel.prototype.writeLock = function(callback) {
  var channel = this;

  function lockOK(srcId) {
    if (srcId !== channel.targetId) {
      return;
    }

    // flag the lock as active
    channel.lock.active = true;

    removeListeners();
    callback(null, channel.lock);
  }

  function lockReject(srcId, existingLockId) {
    if (srcId !== channel.targetId) {
      return;
    }

    removeListeners();
    channel.lock = existingLockId;
    callback(new Error('unable to lock existing lock already in place'));
  }

  function removeListeners() {
    // TODO: be more targeted removing listeners
    channel.signaller.removeListener('writelock:reject', lockReject);
    channel.signaller.removeListener('writelock:ok', lockOK);
  }

  if (this.lock instanceof WriteLock) {
    return callback(new Error('forward writeLock already in place'));
  }
  else if (this.lock) {
    return callback(new Error('reverse writeLock active - cannot lock'));
  }

  // create the new writelock attempt
  this.lock = new WriteLock(this);

  this.signaller.on('writelock:reject', lockReject);
  this.signaller.on('writelock:ok', lockOK);

  // send a writelock message with the id of the lock through
  this.send('/writelock', this.lock.id);
};

Channel.prototype._close = function() {
  this.signaller.removeListener('writelock', this._handleWriteLock);
  this.signaller.removeListener('writelock:release', this._handleReleaseLock);
  this.signaller.removeListener('ping', this._handlePing);
};

/* event handler functions (designed for bound invocation) */

function handlePing(srcId, id) {
  if (srcId !== this.targetId) {
    return;
  }

  // send a response to the ping
  this.send('/pong:' + id);
}

function handleWriteLock(srcId, id) {
  if (srcId !== this.targetId) {
    return;
  }

  if (! this.lock) {
    this.lock = id;
    return this.send('/writelock:ok', id);
  }

  if (this.lock instanceof WriteLock) {
    if (this.lock.active) {
      return this.send('/writelock:reject', this.lock.id);
    }
    else if (id > this.lock.id) {
      return this.send('/writelock:ok', id);
    }
  }

  return this.send('/writelock:reject', this.lock.id || this.lock);
};

function handleReleaseLock(srcId, id) {
  if (srcId !== this.targetId) {
    return;
  }

  if (this.lock === id) {
    this.lock = null;
  }
};