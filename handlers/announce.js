/* jshint node: true */
'use strict';

var extend = require('cog/extend');
var roles = ['a', 'b'];

/**
  ### announce

  ```
  /announce|{}
  ```

  When an announce message is received by the signaller, the attached
  object data is decoded and the signaller emits an `announce` message.

**/
module.exports = function(signaller) {
  return function(args) {
    var data = args[0];
    var peer;
    var ids;

    // if we have valid data then process
    if (data && data.id) {
      // check to see if this is a known peer
      peer = signaller.peers.get(data.id);

      // if the peer is existing, then update the data
      if (peer) {
        // update the data
        peer.data = data;

        // trigger the peer update event
        return signaller.emit('peer:update', data);
      }

      // initialise the ids array and sort
      ids = [data.id, signaller.id].sort();

      // create a new peer
      peer = {
        // determine the roles of the local vs remote
        // participant a: is the lower of the two ids
        // participant b: is the higher of the two ids
        local: roles[ids.indexOf(signaller.id)],
        remote: roles[ids.indexOf(data.id)],

        // initialise the vector clock
        clock: { a: 0, b: 0 },

        // initialise the peer data
        data: data
      };

      // set the peer data
      signaller.peers.set(data.id, peer);

      // send an announce reply
      signaller.to(data.id).send('/announce', signaller.attributes);

      // emit a new peer announce event
      return signaller.emit('peer:announce', data);
    }
  };
};