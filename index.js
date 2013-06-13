var stream = require('stream'),
	util = require('util'),
	knownTransports = {};

function Signaller() {
	// init as a duplex stream
	stream.Duplex.call(this);

	// initialise members
	this.transport = null;
}

util.inherits(Signaller, stream.Duplex);

/**
## introduce(peer)
*/
Signaller.prototype.introduce = function(peer) {
	if (! (peer instanceof RTCPeerConnection)) return;

	// TODO: connect to the relevant RTCPeerConnection events and respond accordingly
	
};

/**
## use(transport, options)

Connect the signaller to the specified transport.  
*/
Signaller.prototype.use = function(transport, options) {
	// if the transport requested is a string, then attempt to load the relevant module
	if (typeof transport == 'string' || (transport instanceof String)) {
		// check to see if we have a known transport mapping
		transport = knownTransports[transport] || transport;

		// require the transport module
		transport = require(transport);
	}

	// if we do not have a valid transport, throw an error
	if (typeof transport != 'function') {
		throw new Error('Invalid transport - cannot connect');
	}

	// if we have an existing transport, then disconnect it
	if (this.transport) {
		this.transport.unpipe(this);
		this.unpipe(this.transport);

		// reset the transport
		this.transport = null;
	}

	// create the transport
	this.transport = transport(options);

	// pipe ourselves to and from the transport
	this.pipe(this.transport).pipe(this);
};