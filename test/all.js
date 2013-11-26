var peers = require('./helpers/createPeers')(3);
var messenger = peers.shift();

// test signalling logic
require('./announce')(messenger, peers);
require('./request')(messenger, peers);
require('./to')(messenger, peers);

// run the channel test with 3 new peers
require('./channel')(require('./helpers/createPeers')(3));

if (typeof window != 'undefined') {
  // test primus loading
  require('./load-primus');
}
