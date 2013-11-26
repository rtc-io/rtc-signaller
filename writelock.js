/* jshint node: true */
'use strict';

var uuid = require('uuid');

function WriteLock(channel) {
  if (! (this instanceof WriteLock)) {
    return new WriteLock(channel);
  }

  this.active = false;
  this.id = uuid.v4();
  this.channel = channel;
}

module.exports = WriteLock;

WriteLock.prototype.release = function() {
  // clear the lock on the local channel
  this.channel.lock = null;

  // send the writelock release message to the other end
  this.channel.send('/writelock:release', this.id);
};