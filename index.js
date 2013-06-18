var EventEmitter = require('events').EventEmitter,
	pull = require('pull-stream'),
	util = require('util'),
    uuid = require('uuid'),
	knownTransports = {};

/**
# SignallingChannel()
*/
function SignallingChannel(opts) {
	if (! (this instanceof SignallingChannel)) return new SignallingChannel(opts);

	// init as a duplex stream
	EventEmitter.call(this);

	// if opts is a string, then we have a channel name
	if (typeof opts == 'string' || (opts instanceof String)) {
		opts = {
			channel: opts
		};
	}

	// ensure we have an opts hash
	opts = opts || {};

    // initialise the channel name
    // TODO: investigate generating shorter unique channel names (uuids aren't easy to communicate)
    this.name = opts.channel || uuid.v4();

	// initialise the messages queue
	this.messages = require('pull-pushable');

	// initialise members
	this.peers = [];
	this._transport = null;
}

util.inherits(SignallingChannel, EventEmitter);
module.exports = SignallingChannel;

/**
## add(peer)
*/
SignallingChannel.prototype.add = function(peer) {
	if (! (peer instanceof RTCPeerConnection)) return;

	// add the peer to the active peers list
	this.peers.push(peer);

	// TODO: connect to the relevant RTCPeerConnection events and respond accordingly
	peer.addEventListener('negotiationneeded', this._negotiate.bind(this, peer));
};

/**
## remove(peer)
*/
SignallingChannel.prototype.remove = function(peer) {
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
Object.defineProperty(SignallingChannel.prototype, 'transport', {
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

        // set the channel name in the transport
        transport.setChannelName(this.name);

		// push the messages to the transport
		// this.messages.pipe(pull.drain(transport.write.bind(transport)));

		// listen for messages from the transport
		pull(
			transport.createReader(),
			pull.drain(this.emit.bind(this, 'message'))
		);
	}
})
