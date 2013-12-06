/* jshint node: true */
'use strict';

var debug = require('cog/logger')('rtc-signaller-lock');
var vc = require('vectorclock');

/**
  ### unlock

  ```
  /unlock|label
  ```

  Clear a remote lock

**/
module.exports = function(signaller) {
  return function(args, messageType, clock, srcState) {
    var label = args[0];
    var ok = false;

    // if we don't have a clock value or don't know about the source
    // then just drop the message
    if ((! clock) || (! srcState)) {
      return;
    }

    debug('received "' + label + '" unlock request from src: ' + srcState.id);

    // if the peer has an active lock, remove it
    if (srcState.locks) {
      // TODO: check for a matching lockid
      srcState.locks.delete(label);
      ok = true;
    }

    // send the lock message
    signaller.to(srcState.id).send('/unlockresult', {
      label: label,
      ok: ok
    });
  };
};