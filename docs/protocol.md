# rtc-signaller Protocol Overview

The signalling used by `rtc-signaller` follows some very simple rules:

- All messages are text (utf-8 encoded at present)

- Message parts are delimited by a pipe (`|`) character

- Message commands must be contained in the initial message part and can be recognized simply as their first character is the forward slash (`/`) character.

- All messages (apart from `/to` messages) are distributed to all active peers currently "announced" in a room.

- All signaling clients identify themselves with a unique, [non-reusable](https://github.com/rtc-io/rtc-signaller/issues/10) id.

---

## Transport Agnostic

While the `rtc-signaller` module provides some default behaviour to connect
via [websockets](http://www.websocket.org/), it is in fact a transport
"agnostic" protocol.

Basically, if you can send text over _x_ then you could use _x_ to send
`rtc-signaller` messages.

---

## Sender Metadata

Sender metadata is injected into a message directly after the command (or initial message part) for all messages.  The only exception is a `/to` message which has no sender metadata attached as this should be contained within the wrapped message.

At this stage only the sender id is included in the sender metadata (JSON), but this may be extended in the future to include additional information.

---

## Core Commands

There are only a few core commands which make up the rtc-signaller signalling. These core commands should receive "special" treatment from a signalling server, whereas other commands are simply "passed through" to connected clients.

---

## /announce

The announce command is used to tell a signalling server (and connected peers) that a new client is joining a virtual room.  The payload of the command is JSON and requires __at least__ an `id` and a `room` attribute to be specified.

For example, this is what an announce message would typically look like (line breaks added for clarity):

```
/announce
|{"id":"dc6ac0ae-6e15-409b-b211-228a8f4a43b9"}
|{"browser":"node","browserVersion":"?","id":"dc6ac0ae-6e15-409b-b211-228a8f4a43b9","agent":"signaller@0.18.3","room":"test-room"}
```

---

## /leave

Unsurprisingly, a `/leave` message is the counterpart to an `/announce` message and is sent when a peer is disconnecting from the room.

__NOTE:__ As most client leave actions are "hard closes", i.e. a browser window / tab has been closed, a signalling server should monitor disconnections and issue an appropriate `/leave` message if the client has not issued one already.

---

## /to

The `/to` command allows you to direct a message to a particular peer rather than broadcasting it to all peers connected to the same room as you.

An example `/to` command might look something like (again line breaks for clarity):

```
/to
|51469ae5-5d9f-4294-84dd-83ce3b37b7dd
|/hello
|{"id":"98e17678-a89e-4f91-aee0-5b0d93ad546d"}
```

For security reasons a signaling server is encouraged to direct `/to` messages only the connected peer; however, a client implementing this protocol should drop all '/to' messages that do not match it's own id.

---

## That's Pretty Much It

From a "protocol" perspective that's really all there is to it.





