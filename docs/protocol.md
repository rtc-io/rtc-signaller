# rtc-signaller Protocol Overview

The signalling used by `rtc-signaller` follows some very simple rules:

- All messages are text (utf-8 encoded at present)
- Message parts are delimited by a pipe (`|`) character
- Message commands must be contained in the initial message part and can
  be recognized simply as their first character is the forward slash (`/`)
  character.

---

## Transport Agnostic

While the `rtc-signaller` module provides some default behaviour to connect
via [websockets](http://www.websocket.org/), it is in fact a transport
"agnostic" protocol.

Basically, if you can send text over _x_ then you could use _x_ to send
`rtc-signaller` messages.

---

## Core Commands

There are only a few core commands which make up the rtc-signaller signalling. These core commands should receive "special" treatment from a signalling server, whereas other commands are simply "passed through" to connected clients.

---

## /announce

The announce command is used to tell a signalling server (and connected peers) that a new client is joining a virtual room.  The payload of the command is JSON and requires __at least__ an `id` and a `room` attribute to be specified.

For example, this is what an announce message would typically look like:

```
TODO: include example
```

---

## /leave

---

## /to

---