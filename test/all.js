var createPeers = require('./helpers/createPeers');
var peers = createPeers(3);
var messenger = peers.shift();

// test signalling logic
// require('./to')(messenger, peers);
require('./message-announce');

require('./announce-event-local');
require('./announce-concurrent');
require('./announce-customid');
require('./announce-debounce');
require('./peer-filter');
require('./set-id');
require('./events');
require('./send-falsey-parts');

// inspect generated messages
require('./announce-raw')(messenger, peers);
require('./custom-metadata')(messenger, peers);

// test automatic messenger implementation
require('./switchboard-auto');
require('./switchboard-announce');
require('./switchboard-announce-customid');
require('./switchboard-manualclose');

if (typeof window != 'undefined') {
  // test primus loading
//   require('./primus-load');
//   require('./primus-announce-payload');
//   require('./primus-reconnect');

  // test native browser websocket support
  require('./browser-websockets');
}
