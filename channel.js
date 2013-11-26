/* jshint node: true */
'use strict';

var WriteLock = require('./writelock');

function Channel(signaller, targetId) {
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

  // initialise the writelock to null
  this.lock = null;

  // handle lock messages
  this.on('writelock', this._handleWriteLock.bind(this));
  this.on('writelock:release', this._handleReleaseLock.bind(this));
}

module.exports = Channel;

Channel.prototype.send = function(command) {
  var payload = [].slice.call(arguments, 1);

  return this.signaller.send.apply(
    this.signaller,
    ['/to', this.targetId, command, this.sourceId].concat(payload)
  );
};

Channel.prototype.writeLock = function(callback) {
  var channel = this;

  function lockOK() {
    // flag the lock as active
    channel.lock.active = true;

    removeListeners();
    callback(null, channel.lock);
  }

  function lockReject(existingLockId) {
    removeListeners();
    channel.lock = existingLockId;
    callback(new Error('unable to lock existing lock already in place'));
  }

  function removeListeners() {
    channel.signaller.removeListener('/writelock:reject', lockReject);
    channel.signaller.removeListener('/writelock:ok', lockOK);
  }

  if (this.lock instanceof WriteLock) {
    return callback(new Error('forward writeLock already in place'));
  }
  else if (this.lock) {
    return callback(new Error('reverse writeLock active - cannot lock'));
  }

  // create the new writelock attempt
  this.lock = new WriteLock(this);

  this.once('writelock:reject', lockReject);
  this.once('writelock:ok', lockOK);

  // send a writelock message with the id of the lock through
  this.send('/writelock', this.lock.id);
};

Channel.prototype._handleWriteLock = function(id) {
  if (! this.lock) {
    this.lock = id;
    return this.send('/writelock:ok', id);
  }

  if (this.lock instanceof WriteLock) {
    if (this.lock.active) {
      return this.send('/writelock:reject', this.lock.id);
    }
  }
};

Channel.prototype._handleReleaseLock = function(id) {
  if (this.lock === id) {
    this.lock = null;
  }
};

['on', 'once'].forEach(function(fn) {
  Channel.prototype[fn] = function(command, handler) {
    var channel = this;

    // if not handler has been supplied, then abort
    if (typeof handler != 'function') {
      return this;
    }

    this.signaller[fn](command, function(sourceId) {
      var payload;

      // if the source is invalid, abort further processing
      if (sourceId !== channel.targetId) {
        return;
      }

      handler.apply(this, [].slice.call(arguments, 1));
    });

    return this;
  };
});