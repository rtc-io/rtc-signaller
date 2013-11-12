var peers = require('./helpers/createPeers')(3);
var messenger = peers.shift();

// test signalling logic
require('./announce')(messenger, peers);
require('./request')(messenger, peers);
require('./block')(messenger, peers);
require('./to')(messenger, peers);

// test primus loading
require('./load-primus');