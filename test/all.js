var peers = require('./helpers/createPeers')(2);
var messenger = peers.shift();

require('./announce')(messenger, peers);
