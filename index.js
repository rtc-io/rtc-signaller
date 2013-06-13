var stream = require('stream'),
	util = require('util');

function Signaller() {
	// init as a duplex stream
	stream.Duplex.call(this);

}

util.inherits(Signaller, stream.Duplex);

/**
## peer(data)

Announce a new peer to the signalling network
*/
Signaller.prototype.peer = function() {
	this.outbound('peer', data);
};