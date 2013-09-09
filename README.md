# rtc-signaller

The `rtc-signaller` module provides a transportless signalling
mechanism for WebRTC.


[![NPM](https://nodei.co/npm/rtc-signaller.png)](https://nodei.co/npm/rtc-signaller/)

[![Build Status](https://travis-ci.org/rtc-io/rtc-signaller.png?branch=master)](https://travis-ci.org/rtc-io/rtc-signaller)
[![experimental](http://hughsk.github.io/stability-badges/dist/experimental.svg)](http://github.com/hughsk/stability-badges)

## Purpose

The signaller provides set of client-side tools that assist with the
setting up `RTCPeerConnections` and helping them communicate. All that is
required for the signaller to operate is a suitable messenger.

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
way and when called it creates a new signaller that will enable
you to communicate with other peers via your messaging network.

```js
// create a signaller from something that knows how to send messages
var signaller = require('rtc-signaller')(messenger);
```

### signaller#send(data)

Send data over the messenging interface.

### signaller#announce(data?)

The `announce` function of the signaller will pass an `/announce` message
through the messenger network.  When no additional data is supplied to
this function then only the id of the signaller is sent to all active
members of the messenging network.

As a unique it is generally insufficient information to determine whether
a peer is a good match for another (for instance,  you might be looking
for other parties by name or role) it is generally a good idea to provide
some additional information during this announce call:

```js
signaller.announce({ role: 'translator' });
```

__NOTE:__ In some particular messenger types may attach or infer
additional data during the announce phase.  For instance, socket.io
connections are generally organised into rooms which is inferred
information that limits the messaging scope.

### signaller#block()

Prevent the signaller from responding to requests until the block
is cleared with a clearBlock call.

### signaller#clearBlock(id)

Clear the specified block id.  Think `clearTimeout` but for signalling
blocks

### signaller#leave()

Leave the messenger mesh

### signaller#request(data)

The `signaller.request` call is where one peer goes looking for a target
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

### scope.to(targetId)

The to method returns an encapsulated

## signaller process handling

When a signaller's underling messenger emits a `data` event this is
delegated to a simple message parser, which applies the following simple
logic:

- Is the message a `/to` message. If so, see if the message is for this
  signaller scope (checking the target id - 2nd arg).  If so pass the
  remainder of the message onto the standard processing chain.  If not,
  discard the message.

- Is the message a command message (prefixed with a forward slash). If so,
  look for an appropriate message handler and pass the message payload on
  to it.

- Finally, does the message match any patterns that we are listening for?
  If so, then pass the entire message contents onto the registered handler.

## signaller message handlers

### announce

```
/announce|{}
```

When an announce message is received by the socket scope, the attached
object data is decoded and the scope emits an `announce` message.

### request

```
/request|{"key":"value","__srcid": "", "__reqid": ""}
```

A request is basically a "search for a friend" message.  This is where one
peer in the mesh is searching for another peer based on particular criteria.
In general, a request message is delivered to all peers within the mesh 
and then those peers that are not in a blocked state will respond.
