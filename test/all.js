var peers = require('./helpers/createPeers')(2);
var messenger = peers.shift();

require('./announce')(messenger, peers);
require('./request')(messenger, peers);
require('./block')(messenger, peers);
