# rtc-signaller

The `rtc-signaller` package provides a simple interface for WebRTC Signalling that is protocol independent.  Rather than tie the implementation specifically to Websockets, XHR, etc. the signaller package allows you to implement signalling in your application and then `pipe` it to the appropriate output interface.

This in turn reduces the overall effort required to implement WebRTC signalling over different protocols and also means that your application code is able to include different underlying transports with relative ease.

## Getting Started (Client)

The first thing you will need to do is to include the `rtc-signaller` package in your application, and provide it a channel name that it will use to communicate with its peers.

```js
var signaller = require('rtc-signaller')('channel-name');
```

The signaller is now ready to interact with an [RTCPeerConnection](http://dev.w3.org/2011/webrtc/editor/webrtc.html#rtcpeerconnection-interface) interface, and can be connected using `introduce` method:

```js
signaller.introduce(peer);
```

Until such time that the signaller is connected to a transport though, no signalling will be done.  Connecting to the transport is completed via the `use` method of the signaller, and an example is displayed below:

```js
signaller.use('websocket', {
	host: 'rtc.io'
});
```

