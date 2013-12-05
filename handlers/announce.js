/* jshint node: true */
'use strict';

var debug = require('cog/logger')('rtc-signaller-announce');
var extend = require('cog/extend');
var roles = ['a', 'b'];

/**
  ### announce

  ```
  /announce|{"id": "...", ... }
  ```

  When an announce message is received by the signaller, the attached
  object data is decoded and the signaller emits an `announce` message.

  #### Events Triggered in response to `/announce`

  There are two different types of `peer:` events that can be triggered
  in on peer B to calling the `announce` method on peer A.

  - `peer:announce`

    The `peer:announce` event is triggered when a new peer has been
    discovered.  The data for the new peer (as an JS object) is provided
    as the first argument of the event handler.

  - `peer:update`

    If a peer "reannounces" then a `peer:update` event will be triggered
    rather than a `peer:announce` event.

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
        debug('signaller: ' + signaller.id + ' received update, data: ', data);

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

      // send an announce reply (if not actually a reply itself)
      if (! data.__reply) {
        signaller
          .to(data.id)
          .send('/announce', extend({ __reply: true }, signaller.attributes));
      }

      // emit a new peer announce event
      return signaller.emit('peer:announce', data);
    }
  };
};