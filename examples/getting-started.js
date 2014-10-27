// create a new signaller, connecting to the target switchboard
var messenger = require('rtc-switchboard-messenger');
var signaller = require('..')(messenger('//switchboard.rtc.io/'));

// when a new peer is announced, log it
signaller.on('peer:announce', function(data) {
 console.log('new peer found in room: ', data);
});

// for our sanity, pop a message once we are connected
signaller.once('connected', function() {
  console.log('we have successfully connected');
});

// send through an announce message
// this will occur once the websocket has been opened and active
signaller.announce({ room: 'signaller-getting-started' });
