/* jshint node: true */
'use strict';

var uuid = require('uuid');
var extend = require('cog/extend');

/**
  # rtc-signaller

  The `rtc-signaller` module provides a transportless signalling
  mechanism for WebRTC.  This is the second implementation of a signaller
  in the rtc.io suite, where we have moving away from a central
  processing model to a pure P2P signalling implementation.

  All that is required for the signaller to operate is a suitable messenger.

  A messenger is a simple object that implements node
  [EventEmitter](http://nodejs.org/api/events.html) style `on` events for
  `open`, `close`, `message` events, and also a `send` method by which 
  data will be send "over-the-wire".

  By using this approach, we can conduct signalling over any number of 
  mechanisms:

  - local, in memory message passing
  - via WebSockets and higher level abstractions (such as 
    [socket.io](http://socket.io) and friends)
  - also over WebRTC data-channels (very meta, and admittedly a little
    complicated).

  ## Getting Started

  To be completed.

  ## Reference

  The `rtc-signaller` module is designed to be used primarily in a functional
  way and when called it creates a new signalling scope that will enable
  you to communicate with other peers via your messaging network.

  ```js
  var signaller = require('rtc-signaller');
  var scope = signaller(messenger);
  ```

**/
module.exports = function(messenger) {

  // create the signalling scope
  var scope = {};

  // initialise the id
  var id = scope.id = uuid.v4();

  /**
    ### scope.send(data)

    Send data over the messenging interface.
  **/
  var send = scope.send = function() {
    // iterate over the arguments and stringify as required
    var params = [].slice.call(arguments).map(function(data) {
      if (typeof data == 'object' && (! (data instanceof String))) {
        return JSON.stringify(data);
      }
      else if (typeof data == 'function') {
        return null;
      }

      return data;
    }).filter(Boolean);

    // send the data over the messenger
    return messenger.send(params.join('|'));
  };

  /**
    ### scope.announce(data?)

    The `announce` function of the scope will a scope message through the
    messenger network.  When no additional data is supplied to this function
    then only the id of the scope is sent to all active members of the
    messenging network.

    As a unique it is generally insufficient information to determine whether
    a peer is a good match for another (for instance,  you might be looking
    for other parties by name or role) it is generally a good idea to provide
    some additional information during this announce call:

    ```js
    scope.announce({ role: 'translator' });
    ```

    __NOTE:__ In some particular messenger types may attach or infer
    additional data during the announce phase.  For instance, socket.io
    connections are generally organised into rooms which is inferred
    information that limits the messaging scope.
  **/
  scope.announce = function(data) {
    return send('/announce', extend({}, data, { id: id }));
  };

  /**
    ### scope.leave()

    Leave the messenger mesh
  **/
  scope.leave = function() {
    return send('/leave', { id: id });
  };

  return scope;
};