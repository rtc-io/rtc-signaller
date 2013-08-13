/* jshint node: true */
'use strict';

/**
  ### announce

  ```
  /announce|{}
  ```

  When an announce message is received by the socket scope, the attached
  object data is decoded and the scope emits an `announce` message.

**/
module.exports = function(scope) {
  return function(args) {
    try {
      scope.emit('announce', JSON.parse(args[0]));
    }
    catch (e) {
    }
  };
};