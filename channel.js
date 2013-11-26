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

Channel.prototype.send = function() {
  return this.signaller.send.apply(
    this.signaller,
    ['/to', this.targetId].concat([].slice.call(arguments))
  );
};

['on', 'once'].forEach(function(fn) {
  Channel.prototype[fn] = function() {
    this.signaller[fn].apply(this.signaller, arguments);
  };
});