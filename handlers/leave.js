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
  };
};