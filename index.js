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
        var channel = this;

        // if this is the same transport, do nothing
        if (this._transport === transport) return;

        // if we have an existing transport, then disconnect
        if (this._transport) {

        }

        // if the transport does not have an init function emit an error
        if (typeof transport.connect != 'function') {
            return this.emit('error', new Error('Cannot initialize transport, ensure transport has a connect method'));
        }

        // update the transport
        this._transport = transport;

        // connect the transport
        transport.connect(function(err) {
            if (err) return channel.emit('error', err);

            // pipe signaller messages to the transport
            channel.messages.pipe(pull.drain(transport.createWriter()));

            // listen for messages from the transport and emit them as messages
            pull(
                transport.createReader(),
                pull.drain(function(data) {
                    channel.emit('message', data);
                })
            );

            channel.messages.push('/channel ' + channel.name);            
        });
    }
})
