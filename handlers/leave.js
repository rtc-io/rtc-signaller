/* jshint node: true */
'use strict';

/**
  ### leave

  ```
  /leave|{"id":"..."}
  ```

  When a leave message is received from a peer, we check to see if that is
  a peer that we are managing state information for and if we are then the
  peer state is removed.

**/
module.exports = function(signaller) {
  return function(args) {
    var data = args[0];
    var peer = signaller.peers.get(data && data.id);

    // if we don't have a valid peer, then don't trigger the event
    if (! peer) {
      return;
    }

    // remove the peer from the peers data
    signaller.peers.delete(data.id);

    // emit the event
    signaller.emit('peer:leave', data);
  };
};