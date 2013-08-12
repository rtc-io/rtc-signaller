# rtc-signaller socket.io demo

This is a demonstation of rtc.io signalling over [socket.io](http://socket.io).  While in many ways socket.io is heavier than required for WebRTC signalling, is is **the** goto library for websockets on node and thus a demo is definitely warranted.

## Running the Demo

First, clone the repo:

```
git clone https://github.com/rtc-io/rtc-signaller.git
```

Change into the examples directory of the signaller repo:

```
cd rtc-signaller/examples
```

Run the socket.io example:

```
node run.js socket.io 3000
```

This will install the required dependencies for the socket.io example, and then start the server on the specified port. If you have used the default port of `3000` then you should then be able to open the demo server at the following url:

<http://localhost:3000/>