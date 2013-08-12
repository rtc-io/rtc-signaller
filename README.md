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
