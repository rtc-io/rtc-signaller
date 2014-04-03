# rtc-signaller

The `rtc-signaller` module provides a transportless signalling
mechanism for WebRTC.


[![NPM](https://nodei.co/npm/rtc-signaller.png)](https://nodei.co/npm/rtc-signaller/)

[![Build Status](https://img.shields.io/travis/rtc-io/rtc-signaller.svg?branch=master)](https://travis-ci.org/rtc-io/rtc-signaller)
![unstable](https://img.shields.io/badge/stability-unstable-yellowgreen.svg)

[![Gitter chat](https://badges.gitter.im/rtc-io/discuss.png)](https://gitter.im/rtc-io/discuss)


## Purpose

The signaller provides set of client-side tools that assist with the
setting up an `PeerConnection` and helping them communicate. All that is
required for the signaller to operate is a suitable messenger.

A messenger is a simple object that implements node
[EventEmitter](http://nodejs.org/api/events.html) style `on` events for
`open`, `close`, `message` events, and also a `send` method by which
data will be send "over-the-wire".

By using this approach, we can conduct signalling over any number of
mechanisms:

- local, in memory message passing
- via WebSockets and higher level abstractions (such as
  [primus](https://github.com/primus/primus))
- also over WebRTC data-channels (very meta, and admittedly a little
  complicated).

## Getting Started

While the signaller is capable of communicating by a number of different
messengers (i.e. anything that can send and receive messages over a wire)
it comes with support for understanding how to connect to an
[rtc-switchboard](https://github.com/rtc-io/rtc-switchboard) out of the box.

The following code sample demonstrates how:

```js
// create a new signaller, connecting to the target switchboard
var signaller = require('rtc-signaller')('http://rtc.io/switchboard');

// when a new peer is announced, log it
signaller.on('peer:announce', function(data) {
 console.log('new peer found in room: ', data);
});

signaller.on('peer:disconnected', function(id) {
  console.log('peer ' + id + ' has been disconnected');
});

// when a peer leaves the switchboard, log it
signaller.on('peer:leave', function(id) {
  console.log('peer ' + id + ' has left the room');
});

// for our sanity, pop a message once we are connected
signaller.once('connected', function() {
  console.log('we have successfully connected');
});

// send through an announce message
// this will occur once the primus socket has been opened and active
signaller.announce({ room: 'signaller-getting-started' });
```

## Signaller Events

There is a number of events that are generating throughout the lifecycle of
a signaller.  These events are derived from events and states that are
generated by the underlying messenger used by the signaller.  In most cases
this is a [primus](https://github.com/primus/primus) websocket connection
(or spark).

### Events regarding local state

The following events are generated by the signaller in response to updates
in it's own state:


- `connected`

  A connection has been established via the underlying
  messenger to a signalling server (or equivalent).

- `disconnected`

  The connection has been lost (possibly temporarily) with
  the signalling server (or transport).  It is possible that the connection
  will be re-established so this does not necessarily mean the end.

### Events regarding peer state

The following events relate to information that has been relayed to this
signaller about other peers:

- `peer:filter`

  The `peer:filter` event is triggered prior to the `peer:announce` or
  `peer:update` events being fired and provides an application the
  opportunity to reject a peer.  The handler for this event is passed
  a JS object that contains a `data` attribute for the announce data, and an
  `allow` flag that controls whether the peer is to be accepted.

  Due to the way event emitters behave in node, the last handler invoked
  is the authority on whether the peer is accepted or not (so make sure to
  check the previous state of the allow flag):

  ```js
  // only accept connections from Bob
  signaller.on('peer:filter', function(evt) {
    evt.allow = evt.allow && (evt.data.name === 'Bob');
  });

  __NOTE:__ This event handler does use a different syntax in the handler
  which provides application developers the opportunity to modify data from
  the event (in this case the `allow` attribute).

- `peer:connected` - If a peer has passed the `peer:filter` test (either
   no filtering has been applied, or the allow flag is set to true in the
   filter events) then a `peer:connected` event will be emitted:

  ```js
  signaller.on('peer:connected', function(id) {
    console.log('peer ' + id + ' has connected');
  });
  ```

  The primary use case for this event is if you are updating part of your
  application UI to flag in response to a `peer:disconnected` event being
  fired (which can be due to poor network connectivity), then you can use
  the `peer:connected` event to restore UI elements to represent an active
  connection on receiving this event.

- `peer:announce`

  While the `peer:connected` event is triggered each time
  a peer reconnects and announces to the signalling server, a `peer:announce`
  event is only emitted by your local signaller if this is considered a
  new connection from a peer.

  If you are writing a WebRTC application, then this event is the best place
  to start creating `RTCPeerConnection` objects between the local machine
  and your remote, announced counterpart.  You will then be able to
  [couple](https://github.com/rtc-io/rtc#rtccouple) those connections
  together using the signaller.

  ```js
  signaller.on('peer:announce', function(data) {
    console.log('discovered new peer: ' + data.id, data);

    // TODO: create a peer connection with our new friend :)
  });
  ```

- `peer:update`

  An existing peer in the system has been "re-announced"
  possibly with some data changes:

  ```js
  signaller.on('peer:update', function(data) {
    console.log('data update from peer: ' + data.id, data);
  });
  ```

- `peer:disconnected`

  A peer has disconnected from the signalling server,
  but may reconnect if it manages to re-establish connectivity.

  ```js
  signaller.on('peer:disconnected', function(id) {
    console.log('peer ' + id + ' has gone, but they might be back...');
  });
  ```

- `peer:leave`

  This event is triggered when the signaller has previously
  received a disconnection notification for a peer, and a reconnection has
  not been made by that peer within a certain time interval.

  The default `leaveTimeout` is configured in the
  [defaults](https://github.com/rtc-io/rtc-signaller/blob/master/defaults.js)
  but can be overriden by passing configuration options when creating the
  signaller.

  ```js
  signaller.on('peer:leave', function(id) {
    console.log('peer ' + id + ' has left :(');
  });
  ```

## Signal Flow Diagrams

Displayed below are some diagrams how the signalling flow between peers
behaves.  In each of the diagrams we illustrate three peers (A, B and C)
participating discovery and coordinating RTCPeerConnection handshakes.

In each case, only the interaction between the clients is represented not
how a signalling server
(such as [rtc-switchboard](https://github.com/rtc-io/rtc-switchboard)) would
pass on broadcast messages, etc.  This is done for two reasons:

1. It is out of scope of this documentation.
2. The `rtc-signaller` has been designed to work without having to rely on
   any intelligence in the server side signalling component.  In the
   instance that a signaller broadcasts all messages to all connected peers
   then `rtc-signaller` should be smart enough to make sure everything works
   as expected.

### Peer Discovery / Announcement

This diagram illustrates the process of how peer `A` announces itself to
peers `B` and `C`, and in turn they announce themselves.

![](https://raw.github.com/rtc-io/rtc-signaller/master/docs/announce.png)

### Editing / Updating the Diagrams

Each of the diagrams has been generated using
[mscgen](http://www.mcternan.me.uk/mscgen/index.html) and the source for
these documents can be found in the `docs/` folder of this repository.

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

### signaller#send(message, data*)

Use the send function to send a message to other peers in the current
signalling scope (if announced in a room this will be a room, otherwise
broadcast to all peers connected to the signalling server).

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

### isMaster(targetId)

A simple function that indicates whether the local signaller is the master
for it's relationship with peer signaller indicated by `targetId`.  Roles
are determined at the point at which signalling peers discover each other,
and are simply worked out by whichever peer has the lowest signaller id
when lexigraphically sorted.

For example, if we have two signaller peers that have discovered each
others with the following ids:

- `b11f4fd0-feb5-447c-80c8-c51d8c3cced2`
- `8a07f82e-49a5-4b9b-a02e-43d911382be6`

They would be assigned roles:

- `b11f4fd0-feb5-447c-80c8-c51d8c3cced2`
- `8a07f82e-49a5-4b9b-a02e-43d911382be6` (master)

### leave()

Tell the signalling server we are leaving.  Calling this function is
usually not required though as the signalling server should issue correct
`/leave` messages when it detects a disconnect event.

### metadata(data?)

Get (pass no data) or set the metadata that is passed through with each
request sent by the signaller.

__NOTE:__ Regardless of what is passed to this function, metadata
generated by the signaller will **always** include the id of the signaller
and this cannot be modified.

### to(targetId)

Use the `to` function to send a message to the specified target peer.
A large parge of negotiating a WebRTC peer connection involves direct
communication between two parties which must be done by the signalling
server.  The `to` function provides a simple way to provide a logical
communication channel between the two parties:

```js
var send = signaller.to('e95fa05b-9062-45c6-bfa2-5055bf6625f4').send;

// create an offer on a local peer connection
pc.createOffer(
  function(desc) {
    // set the local description using the offer sdp
    // if this occurs successfully send this to our peer
    pc.setLocalDescription(
      desc,
      function() {
        send('/sdp', desc);
      },
      handleFail
    );
  },
  handleFail
);
```

### loadPrimus(signalhost, callback)

This is a convenience function that is patched into the signaller to assist
with loading the `primus.js` client library from an `rtc-switchboard`
signaling server.

### signaller process handling

When a signaller's underling messenger emits a `data` event this is
delegated to a simple message parser, which applies the following simple
logic:

- Is the message a `/to` message. If so, see if the message is for this
  signaller (checking the target id - 2nd arg).  If so pass the
  remainder of the message onto the standard processing chain.  If not,
  discard the message.

- Is the message a command message (prefixed with a forward slash). If so,
  look for an appropriate message handler and pass the message payload on
  to it.

- Finally, does the message match any patterns that we are listening for?
  If so, then pass the entire message contents onto the registered handler.

### signaller message handlers

#### announce

```
/announce|%metadata%|{"id": "...", ... }
```

When an announce message is received by the signaller, the attached
object data is decoded and the signaller emits an `announce` message.

#### leave

```
/leave|{"id":"..."}
```

When a leave message is received from a peer, we check to see if that is
a peer that we are managing state information for and if we are then the
peer state is removed.

## License(s)

### Apache 2.0

Copyright 2013 - 2014 National ICT Australia Limited (NICTA)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
