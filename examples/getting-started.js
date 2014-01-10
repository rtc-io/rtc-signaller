// create a new signaller, connecting to the target switchboard
var signaller = require('..')('http://rtc.io/switchboard');

// when a new peer is announced, log it
signaller.on('peer:announce', function(data) {
 console.log('new peer found in room: ', data);
});

// when a peer leaves the switchboard, log it
signaller.on('peer:leave', function(id) {
  console.log('peer ' + id + ' has left the room');
});

// for our sanity, pop a message once we are connected
signaller.once('connected', function() {
  console.log('we have successfully connected');
});

// send through an announce message
// this will occur once the primus socket has been opened and active
signaller.announce({ room: 'signaller-getting-started' });