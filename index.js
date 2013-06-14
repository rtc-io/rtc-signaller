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
	this._transport = null;
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
## transport
*/
Object.defineProperty(Signaller.prototype, 'transport', {
	get: function() {
		return this._transport;
	},

	set: function(transport) {
		// if this is the same transport, do nothing
		if (this._transport === transport) return;

		// if we have an existing transport, then disconnect
		if (this._transport) {

		}

		// update the transport
		this._transport = transport;

		// push the messages to the transport
		this.messages.pipe(pull.drain(transport.write.bind(transport)));

		// listen for messages from the transport
		pull(
			transport.createReader(),
			pull.drain(this.emit.bind(this, 'message'))
		);
	}
})