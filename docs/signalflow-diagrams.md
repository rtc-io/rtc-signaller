## Signal Flow Diagrams

Displayed below are some diagrams how the signalling flow between peers behaves.  In each of the diagrams we illustrate three peers (A, B and C) participating discovery and coordinating RTCPeerConnection handshakes.

In each case, only the interaction between the clients is represented not how a signalling server (such as [rtc-switchboard](https://github.com/rtc-io/rtc-switchboard)) would pass on broadcast messages, etc.  This is done for two reasons:

  1. It is out of scope of this documentation.
  2. The `rtc-signaller` has been designed to work without having to rely on any intelligence in the server side signalling component.  In the instance that a signaller broadcasts all messages to all connected peers then `rtc-signaller` should be smart enough to make sure everything works as expected.

### Peer Discovery / Announcement

This diagram illustrates the process of how peer `A` announces itself to peers `B` and `C`, and in turn they announce themselves.

![](https://raw.github.com/rtc-io/rtc-signaller/master/docs/announce.png)

### Editing / Updating the Diagrams

Each of the diagrams has been generated using [mscgen](http://www.mcternan.me.uk/mscgen/index.html) and the source for these documents can be found in the `docs/` folder of this repository.
