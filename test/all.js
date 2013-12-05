var createPeers = require('./helpers/createPeers');
var peers = createPeers(3);
var messenger = peers.shift();

// test signalling logic
// require('./announce-raw')(messenger, peers);
// require('./to')(messenger, peers);

require('./announce-events');
require('./announce-concurrent');

// test announce

if (typeof window != 'undefined') {
  // test primus loading
  require('./load-primus');
}
