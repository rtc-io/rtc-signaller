/* jshint node: true */
'use strict';

var detect = require('rtc-core/detect');
var extend = require('cog/extend');
var mbus = require('mbus');
var getable = require('cog/getable');
var uuid = require('cuid');
var pull = require('pull-stream');
var pushable = require('pull-pushable');
var prepare = require('rtc-signal/prepare');
var createQueue = require('pull-pushable');

// ready state constants
var RS_DISCONNECTED = 0;
var RS_CONNECTING = 1;
var RS_CONNECTED = 2;

// initialise signaller metadata so we don't have to include the package.json
// TODO: make this checkable with some kind of prepublish script
var metadata = {
  version: '6.3.0'
};

/**
  # rtc-signaller

  The `rtc-signaller` module provides a transportless signalling
  mechanism for WebRTC.

  ## Purpose

  <<< docs/purpose.md

  ## Getting Started

  While the signaller is capable of communicating by a number of different
  messengers (i.e. anything that can send and receive messages over a wire)
  it comes with support for understanding how to connect to an
  [rtc-switchboard](https://github.com/rtc-io/rtc-switchboard) out of the box.

  The following code sample demonstrates how:

  <<< examples/getting-started.js

  <<< docs/events.md

  <<< docs/signalflow-diagrams.md

  <<< docs/identifying-participants.md

  ## Reference

  The `rtc-signaller` module is designed to be used primarily in a functional
  way and when called it creates a new signaller that will enable
  you to communicate with other peers via your messaging network.

  ```js
  // create a signaller from something that knows how to send messages
  var signaller = require('rtc-signaller')(messenger);
  ```

  As demonstrated in the getting started guide, you can also pass through
  a string value instead of a messenger instance if you simply want to
  connect to an existing `rtc-switchboard` instance.

**/
module.exports = function(messenger, opts) {
  var autoconnect = (opts || {}).autoconnect;
  var reconnect = (opts || {}).reconnect;
  var queue = createQueue();
  var connectionCount = 0;

  // create the signaller
  var signaller = require('rtc-signal/signaller')(opts, bufferMessage);

  var announced = false;
  var announceTimer = 0;
  var readyState = RS_DISCONNECTED;

  function bufferMessage(message) {
    queue.push(message);

    // if we are not connected (and should autoconnect), then attempt connection
    if (readyState === RS_DISCONNECTED && (autoconnect === undefined || autoconnect)) {
      connect();
    }
  }

  function handleDisconnect() {
    if (reconnect === undefined || reconnect) {
      setTimeout(connect, 50);
    }
  }

  /**
    ### `signaller.connect()`

    Manually connect the signaller using the supplied messenger.

    __NOTE:__ This should never have to be called if the default setting
    for `autoconnect` is used.
  **/
  var connect = signaller.connect = function() {
    // if we are already connecting then do nothing
    if (readyState === RS_CONNECTING) {
      return;
    }

    // initiate the messenger
    readyState = RS_CONNECTING;
    messenger(function(err, source, sink) {
      if (err) {
        readyState = RS_DISCONNECTED;
        return signaller('error', err);
      }

      // increment the connection count
      connectionCount += 1;

      // flag as connected
      readyState = RS_CONNECTED;

      // pass messages to the processor
      pull(
        source,

        // monitor disconnection
        pull.through(null, function() {
          queue = createQueue();
          readyState = RS_DISCONNECTED;
          signaller('disconnected');
        }),
        pull.drain(signaller._process)
      );

      // pass the queue to the sink
      pull(queue, sink);

      // handle disconnection
      signaller.removeListener('disconnected', handleDisconnect);
      signaller.on('disconnected', handleDisconnect);

      // trigger the connected event
      signaller('connected');

      // if this is a reconnection, then reannounce
      if (announced && connectionCount > 1) {
        signaller._announce();
      }
    });
  };

  /**
    ### announce(data?)

    The `announce` function of the signaller will pass an `/announce` message
    through the messenger network.  When no additional data is supplied to
    this function then only the id of the signaller is sent to all active
    members of the messenging network.

    #### Joining Rooms

    To join a room using an announce call you simply provide the name of the
    room you wish to join as part of the data block that you annouce, for
    example:

    ```js
    signaller.announce({ room: 'testroom' });
    ```

    Signalling servers (such as
    [rtc-switchboard](https://github.com/rtc-io/rtc-switchboard)) will then
    place your peer connection into a room with other peers that have also
    announced in this room.

    Once you have joined a room, the server will only deliver messages that
    you `send` to other peers within that room.

    #### Providing Additional Announce Data

    There may be instances where you wish to send additional data as part of
    your announce message in your application.  For instance, maybe you want
    to send an alias or nick as part of your announce message rather than just
    use the signaller's generated id.

    If for instance you were writing a simple chat application you could join
    the `webrtc` room and tell everyone your name with the following announce
    call:

    ```js
    signaller.announce({
      room: 'webrtc',
      nick: 'Damon'
    });
    ```

    #### Announcing Updates

    The signaller is written to distinguish between initial peer announcements
    and peer data updates (see the docs on the announce handler below). As
    such it is ok to provide any data updates using the announce method also.

    For instance, I could send a status update as an announce message to flag
    that I am going offline:

    ```js
    signaller.announce({ status: 'offline' });
    ```

  **/
  signaller.announce = function(data) {
    announced = true;
    signaller._update(data);
    clearTimeout(announceTimer);

    // send the attributes over the network
    return announceTimer = setTimeout(signaller._announce, (opts || {}).announceDelay || 10);
  };

  /**
    ### leave()

    Tell the signalling server we are leaving.  Calling this function is
    usually not required though as the signalling server should issue correct
    `/leave` messages when it detects a disconnect event.

  **/
  signaller.leave = signaller.close = function() {
    // send the leave signal
    signaller.send('/leave', { id: signaller.id });

    // stop announcing on reconnect
    signaller.removeListener('disconnected', handleDisconnect);
    signaller.removeListener('connected', signaller._announce);

    // end our current queue
    queue.end();

    // set connected to false
    readyState = RS_DISCONNECTED;
  };

  // update the signaller agent
  signaller._update({ agent: 'signaller@' + metadata.version });

  // autoconnect
  if (autoconnect === undefined || autoconnect) {
    connect();
  }

  return signaller;
};
