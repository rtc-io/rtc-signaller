/* jshint node: true */
'use strict';

var debug = require('cog/logger')('rtc-signaller-lock');
var vc = require('vectorclock');

/**
  ### lock

  ```
  /lock
  ```

  A `/lock` request can only be sent within the context of a `/to` message
  and thus must contain source data to be processed correctly.  The `/lock`
  message is used to coordinate betwen two remote peers in the case that
  both peers which to commence renegotiation at the same time.

  In the case that two peers attempt to renegotiate with each other at the
  same time, then the peer that has been identified as party `a` in the peer
  relationship will take on the role of the initiator in the negotiation and
  party `b` will respond to the offer sdp.

**/
module.exports = function(signaller) {
  return function(args, messageType, clock, srcState) {
    var clockComparison;
    var failed = true;

    // if we don't have a clock value or don't know about the source
    // then just drop the message
    if ((! clock) || (! srcState)) {
      return;
    }

    debug('received lock request from src: ' + srcState.id);
    clockComparison = vc.compare(clock, srcState.clock);

    // if the remote clock is greater than the lock clock state
    // then the lock is automatically successful
    failed = clockComparison < 0 ||
      (clockComparison === 0 && srcState.roleIdx > 0);

    // console.log('signaller ' + signaller.id + ' checking lock state');
    // console.log('clock comparison = ' + clockComparison + ' failed: ' + failed, srcState);

    // send the lock result
    signaller.to(srcState.id).send('/lockresult', { fail: failed });
  };
};