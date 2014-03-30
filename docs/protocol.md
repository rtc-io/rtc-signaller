# rtc-signaller Protocol Overview

The signalling used by `rtc-signaller` follows some very simple rules:

- All messages are text (utf-8 encoded at present)
- Message parts are delimited by a pipe (`|`) character
- Message commands must be contained in the initial message part and can
  be recognized simply as their first character is the forward slash (`/`)
  character.

--

## Transport Agnostic

While the `rtc-signaller` module provides some default behaviour to connect
via [websockets](http://www.websocket.org/), it is in fact a transport
"agnostic" protocol.

Basically, if you can send text over _x_ then you could use _x_ to send
`rtc-signaller` messages.

--

## Standard Messages

--

## `/announce`

```
/announce
```