var peers = require('./helpers/createPeers')(3);
var messenger = peers.shift();

// test signalling logic
require('./announce')(messenger, peers);
require('./request')(messenger, peers);
require('./block')(messenger, peers);
require('./to')(messenger, peers);

if (typeof window != 'undefined') {
  // test primus loading
  require('./load-primus');
}
