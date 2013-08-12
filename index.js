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

  // initialise the attributes
  var attributes = {
    id: id
  };

  // create the message matchers array
  var matchers = [];

  function createChannel(targetId) {
    return {
      send: function() {
        send.apply(['/to', targetId].concat([].slice.call(arguments)));
      }
    };
  }

  function once(prefix, handler) {
    matchers.push({
      prefix: prefix,
      handler: handler
    });
  }

  function processData(data) {
    var isMatch = true;

    // process /to messages
    if (data.slice(0, 3) === '/to') {
      isMatch = data.slice(4, id.length + 4) === id;
      if (isMatch) {
        data = data.slice(5 + id.length);
      }
    }

    // if this is not a match, then bail
    if (! isMatch) {
      return;
    }

    // process matchers
    matchers = matchers.filter(function(rule) {
      var exec = data.slice(0, rule.prefix.length) === rule.prefix;

      if (exec && typeof rule.handler == 'function') {
        rule.handler(data);
      }

      // only keep if not executed
      return !exec;
    });
  }

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
    // update internal attributes
    extend(attributes, data, { id: id });

    // send the attributes over the network
    return send('/announce', attributes);
  };

  /**
    ### scope.leave()

    Leave the messenger mesh
  **/
  scope.leave = function() {
    return send('/leave', { id: id });
  };

  /**
    ### scope.request(data)

    The `scope.request` call is where one peer goes looking for a target
    peer that satisfies specific search parameters.  This may be a search
    for a peer with a particular id, or something more general such as
    a request for a peer with a particular name or role.

    Once a suitable match has been found from within the messenging network
    the callback will fire and provide a discrete messaging channel to that
    particular peer.

    __NOTE:__ The discreteness of the message needs to be programmed at the
    mesh level if required. Signallers will not attempt to parse a message
    destined for another signaller, but they are visible by default.  This
    can easily be handled however, by filtering `/to` messages.
  **/
  scope.request = function(data, opts, callback) {
    // initialise a request id
    var reqid = uuid.v4();

    // handle 2 arg form
    if (typeof opts == 'function') {
      callback = opts;
      opts = {};
    }

    // TODO: inspect known peers for a match

    // handle request acknowledge
    once('/ackreq|' + reqid, function(data) {
      var targetId = data.split('|')[2];

      // trigger the callback with the send function wired
      callback(null, createChannel(targetId));
    });

    // send out a request across the network
    send('/request', extend({}, data, { __reqid: reqid }));
  };

  // handle message data events
  messenger.on('data', processData);

  return scope;
};