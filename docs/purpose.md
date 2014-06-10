The signaller provides set of client-side tools that assist with the setting up an `PeerConnection` and helping them communicate. All that is required for the signaller to operate is a suitable messenger.

A messenger is a simple object that implements node [EventEmitter](http://nodejs.org/api/events.html) style `on` events for `open`, `close`, `message` events, and also a `send` method by which data will be send "over-the-wire".

By using this approach, we can conduct signalling over any number of mechanisms:

- local, in memory message passing
- via WebSockets and higher level abstractions (such as [primus](https://github.com/primus/primus))
- also over WebRTC data-channels (very meta, and admittedly a little complicated).
