var createPeers = require('./helpers/createPeers');
var peers = createPeers(3);
var messenger = peers.shift();

// test signalling logic
// require('./to')(messenger, peers);

require('./announce-concurrent');
require('./announce-debounce');
require('./peer-filter');
require('./set-id');
require('./events');

// inspect generated messages
require('./announce-raw')(messenger, peers);
require('./custom-metadata')(messenger, peers);

if (typeof window != 'undefined') {
  // test primus loading
  require('./primus-load');

  // test automatic messenger implementation
  require('./primus-auto');

  // test primus reconnection logic
  // require('./primus-reconnect');

  // test native browser websocket support
  require('./browser-websockets');
}
