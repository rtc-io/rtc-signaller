var EventEmitter = require('events').EventEmitter,
	pull = require('pull-stream'),
	knownTransports = {};

/**
# Signaller()
*/
function Signaller() {
	// init as a duplex stream
	EventEmitter.call(this);

	// initialise the messages queue
	this.messages = require('pull-pushable');

	// initialise members
	this.peers = [];
	this.transport = null;
}

util.inherits(Signaller, EventEmitter);

/**
## add(peer)
*/
Signaller.prototype.add = function(peer) {
	if (! (peer instanceof RTCPeerConnection)) return;

	// add the peer to the active peers list
	this.peers.push(peer);

	// TODO: connect to the relevant RTCPeerConnection events and respond accordingly
	peer.addEventListener('negotiationneeded', this._negotiate.bind(this, peer));
};

/**
## remove(peer)
*/
Signaller.prototype.remove = function(peer) {
	var index = this.peers.indexOf(peer);

	// if we are managing the peer, then remove event listeners
	if (index >= 0) {
		// TODO: unbind event listeners

		// remove the peer from the list
		this.peers.splice(index, 1);		
	}
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

	// TODO: if we have an existing transport, then disconnect it
	if (this.transport) {
	}

	// create the transport
	this.transport = transport(options);

	// push the messages to the transport
	this.messages.pipe(pull.drain(this.transport.write.bind(this.transport)));

	// listen for messages from the transport
	pull(
		this.transport.createReader(),
		pull.drain(this.emit.bind(this, 'message'))
	);
};