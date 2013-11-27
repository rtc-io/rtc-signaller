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

  // initialise the proxy event listeners
  this._proxies = {};

  // handle lock messages
  this.on('writelock', this._handleWriteLock.bind(this));
  this.on('writelock:release', this._handleReleaseLock.bind(this));
  this.on('ping', this._handlePing.bind(this));
}

module.exports = Channel;

Channel.prototype.ping = function(callback) {
  var signaller = this.signaller;
  var testId = uuid.v4();
  var pingTimeout = 0;

  this.send('/ping', testId);
  this.once('pong:' + testId, function() {
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
    // TODO: be more targeted removing listeners
    channel.signaller.removeAllListeners('writelock:reject');
    channel.signaller.removeAllListeners('writelock:ok');
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

Channel.prototype._handlePing = function(id) {
  // send a response to the ping
  this.send('/pong:' + id);
};

Channel.prototype._close = function() {
  var proxies = this._proxies;
  var signaller = this.signaller;

  // iterate through the proxies and close
  Object.keys(proxies).forEach(function(eventName) {
    proxies[eventName].forEach(function(handler) {
      signaller.removeListener(eventName, handler);
    });
  });
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
    else if (id > this.lock.id) {
      return this.send('/writelock:ok', id);
    }
  }

  return this.send('/writelock:reject', this.lock.id || this.lock);
};

Channel.prototype._handleReleaseLock = function(id) {
  if (this.lock === id) {
    this.lock = null;
  }
};

['on', 'once'].forEach(function(fn) {
  Channel.prototype[fn] = function(command, handler) {
    var channel = this;

    function proxyEvent(sourceId) {
      var payload;

      // if the source is invalid, abort further processing
      if (sourceId !== channel.targetId) {
        return;
      }

      handler.apply(this, [].slice.call(arguments, 1));
    }

    // if not handler has been supplied, then abort
    if (typeof handler != 'function') {
      return this;
    }

    // register the event proxy
    this.signaller[fn](command, proxyEvent);

    // add the proxy to the list of proxies
    this._proxies[command] = this._proxies[command] || [];
    this._proxies[command].push(proxyEvent);

    return this;
  };
});