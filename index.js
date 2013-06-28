var EventEmitter = require('events').EventEmitter,
    pull = require('pull-stream'),
    pushable = require('pull-pushable'),
    util = require('util'),
    uuid = require('uuid'),
    errorcodes = require('rtc-core/errorcodes');

/**
# SignallingPeer()
*/
function SignallingPeer(opts) {
    if (! (this instanceof SignallingPeer)) return new SignallingPeer(opts);
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
    this.outbound = pushable();

    // initialise members
    this.id = null;
    this.debug = opts.debug && typeof console.log == 'function';
    this.peers = [];
    this.transport = null;

    // create the message parser for this signaller
    this.on('message', createMessageParser(this));

    // when we receive an identity update, update our id
    this.on('identity', this.setIdentity.bind(this));
    this.on('join:ok', this._joinChannel.bind(this));
    this.on('peer:discover', this._peerDiscover.bind(this));
}

util.inherits(SignallingPeer, EventEmitter);
module.exports = SignallingPeer;

/**
## negotiate(targetId, sdp, callId, type)

The negotiate function handles the process of sending an updated Session
Description Protocol (SDP) description to the specified target signalling
peer.  If this is an established connection, then a callId will be used to 
ensure the sdp is deliver to the correct RTCPeerConnection instance
*/
SignallingPeer.prototype.negotiate = function(targetId, sdp, callId, type) {
    this.send('/negotiate', targetId, sdp, callId || 0, type);
};

/**
## remove(peer)
*/
SignallingPeer.prototype.remove = function(peer) {
    var index = this.peers.indexOf(peer);

    // if we are managing the peer, then remove event listeners
    if (index >= 0) {
        // TODO: unbind event listeners

        // remove the peer from the list
        this.peers.splice(index, 1);        
    }
};

/**
## send(data)

Send data across the line
*/
SignallingPeer.prototype.send = function() {
    var args = [].slice.call(arguments);

    if (this.transport) {
        // jsonify data as required
        args = args.map(function(arg) {
            return typeof arg == 'object' ? JSON.stringify(arg) : arg;
        });

        // send the message
        console.log('--> ' + args.join('|'));
        this.outbound.push(args.join('|'));
    }
};

/**
## setIdentity
*/
SignallingPeer.prototype.setIdentity = function(data) {
    // update our id
    this.id = data && data.id;
};

/*
## setTransport
*/
SignallingPeer.prototype.setTransport = function(transport) {
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
        channel.outbound.pipe(pull.drain(transport.createWriter()));

        // listen for messages from the transport and emit them as messages
        pull(
            transport.createReader(),
            pull.drain(channel.emit.bind(channel, 'message'))
        );

        channel.send('/join', channel.name);            
    });

};

/* "private" event handlers */

SignallingPeer.prototype._peerDiscover = function(peer) {
    // add the peer to the list of peers
    this.peers.push(peer);
};

/**
## _joinChannel(channelName)

This is the event handler for the join:ok event
*/
SignallingPeer.prototype._joinChannel = function(channelName) {
    // update the name with the specified channel name
    // TODO: if channel changed, maybe emit another event?
    this.name = channelName;

    // emit the ready event
    this.emit('ready');
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
                return ['{', '['].indexOf(arg.charAt(0)) >= 0 ? JSON.parse(arg) : arg;
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
