The signaller provides set of client-side tools that assist with the setting up an `PeerConnection` and helping them communicate. All that is required for the signaller to operate is a [suitable messenger](https://github.com/DamonOehlman/messenger-archetype).  A messenger is simply a function that is able to create a [pull-stream](https://github.com/dominictarr/pull-stream) `Source` and/or `Sink`.  From version `5.0.0` the `rtc-signaller` package will use pull-streams to ensure robust delivery of messages.

By using this approach, we can conduct signalling over any number of mechanisms:

- local, [in memory](https://github.com/DamonOehlman/messenger-memory) message passing
- via [WebSockets](https://github.com/DamonOehlman/messenger-ws) and higher level abstractions (such as [primus](https://github.com/primus/primus))

In the event that you want to implement a signaller without using pull-streams, then you can work from a base signaller using the [`rtc-signal/signaller`](https://github.com/rtc-io/rtc-signal/blob/master/signaller.js) implementation.
