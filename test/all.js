var createGroup = require('./helpers/messenger-group');
// test signalling logic
// require('./to')(messenger, peers);

require('./announce-event-local');
require('./announce-concurrent');
require('./announce-customid');
require('./announce-debounce');
require('./peer-filter');
require('./set-id');
require('./events');

// inspect generated messages
require('./announce-raw')(createGroup(3));
require('./custom-metadata')(createGroup(3));
require('./send-falsey-parts')(createGroup(2));
require('./message-announce')(createGroup(2));

// test automatic messenger implementation
require('./switchboard-auto');
require('./switchboard-announce');
require('./switchboard-announce-customid');
require('./switchboard-manualclose');
require('./switchboard-announce-concurrent');

if (typeof window != 'undefined') {
  // test primus loading
//   require('./primus-load');
//   require('./primus-announce-payload');
//   require('./primus-reconnect');

  // test native browser websocket support
  require('./browser-websockets');
}
