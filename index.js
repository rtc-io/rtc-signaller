var EventEmitter = require('events').EventEmitter,
    pull = require('pull-stream'),
    pushable = require('pull-pushable'),
    util = require('util'),
    uuid = require('uuid');

/**
# SignallingChannel()
*/
function SignallingChannel(opts) {
    if (! (this instanceof SignallingChannel)) return new SignallingChannel(opts);
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
    this.messages = pushable();

    // initialise members
    this.id = null;
    this.debug = opts.debug && typeof console.log == 'function';
    this.peers = [];
    this.transport = null;

    // create the message parser for this signaller
    this.on('message', createMessageParser(this));

    // when we receive an identity update, update our id
    this.on('identity', this.setIdentity.bind(this));
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
## setIdentity
*/
SignallingChannel.prototype.setIdentity = function(data) {
    // update our id
    this.id = data && data.id;
};

/*
## setTransport
*/
SignallingChannel.prototype.setTransport = function(transport) {
    var channel = this;

    // if this is the same transport, do nothing
    if (this.transport === transport) return;

    // if we have an existing transport, then disconnect
    if (this.transport) {

    }

    // if the transport does not have an init function emit an error
    if (typeof transport.connect != 'function') {
        return this.emit('error', new Error('Cannot initialize transport, ensure transport has a connect method'));
    }

    // update the transport
    this.transport = transport;

    // connect the transport
    transport.connect(function(err) {
        if (err) return channel.emit('error', err);

        // pipe signaller messages to the transport
        channel.messages.pipe(pull.drain(transport.createWriter()));

        // listen for messages from the transport and emit them as messages
        pull(
            transport.createReader(),
            pull.drain(channel.emit.bind(channel, 'message'))
        );

        channel.messages.push('/join ' + channel.name);            
    });

};

/* internals */

/**
## createMessageParser(signaller)

This is used to create a function handler that will operate more quickly that 
when using bind.  The parser will pull apart a message into parts (splitting 
on the pipe character), parsing those parts where appropriate and then
triggering the relevant event.
*/
function createMessageParser(signaller) {
    return function(data) {
        var parts = (data || '').split('|'),
            evtName = parts[0],
            args = parts.slice(1).map(function(arg) {
                // if it looks like JSON then parse it
                return arg.charAt(0) === '{' ? JSON.parse(arg) : arg;
            });

        if (signaller.debug) {
            console.log('<-- ' + data);
        }

        // trigger the event
        if (evtName) {
            signaller.emit.apply(signaller, [evtName].concat(args));
        }
    };
}
