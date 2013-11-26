/* jshint node: true */
'use strict';

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
}

module.exports = Channel;

Channel.prototype.send = function(command) {
  var payload = [].slice.call(arguments, 1);

  return this.signaller.send.apply(
    this.signaller,
    ['/to', this.targetId, command, this.sourceId].concat(payload)
  );
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