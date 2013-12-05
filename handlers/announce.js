/* jshint node: true */
'use strict';

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
    var payload;

    try {
      payload = JSON.parse(args[0]);
    }
    catch (e) {
    }

    if (! payload) {
      return signaller.emit('error', 'Unable to announce, invalid JSON: ' + args[0]);
    }

    return signaller.emit('announce', payload);
  };
};