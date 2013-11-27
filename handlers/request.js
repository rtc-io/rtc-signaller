/* jshint node: true */
'use strict';

var matcher = require('../matcher');

/**
  ### request

  ```
  /request|{"key":"value","__srcid": "", "__reqid": ""}
  ```

  A request is basically a "search for a friend" message.  This is where one
  peer in the mesh is searching for another peer based on particular criteria.
  In general, a request message is delivered to all peers within the mesh
  and then those peers that are not in a blocked state will respond.

**/
module.exports = function(scope) {
  var attributes = scope.attributes;
  var match = matcher(attributes);

  function ackRequest(data) {
    // look for request listeners
    var listeners = scope.listeners('request');

    // TODO: trigger listeners, wait for completion
    if (listeners && listeners.length > 0) {
    }

    // send the ack request
    scope.send(
      '/to', data.__srcid,
      '/ackreq', data.__reqid, scope.id
    );
  }

  return function(data) {
    try {
      // convert to JSON
      data = JSON.parse(data);
    }
    catch (e) {
      return false;
    }

    // if we have a match, then acknowledge the request
    if (match(data)) {
      return ackRequest(data);
    }

    return false;
  };
};