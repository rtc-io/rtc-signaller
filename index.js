var EventEmitter = require('events').EventEmitter,
    pull = require('pull-stream'),
    pushable = require('pull-pushable'),
    util = require('util'),
    errorcodes = require('rtc-core/errorcodes');

/**
# Signaller()
*/
function Signaller(opts) {
    if (! (this instanceof Signaller)) return new Signaller(opts);
    EventEmitter.call(this);

    // if opts is a string, then we have a channel name
    if (typeof opts == 'string' || (opts instanceof String)) {
        opts = {
            channel: opts
        };
    }

    // initialise the messages queue
    this.outbound = pushable();

    // ensure we have an opts hash
    opts = opts || {};

    // ensure we have a transport creator
    opts.transport = opts.transport || 
        opts.transportCreator || 
        require('./transports/socket');

    // initialise members
    this.debug = opts.debug && typeof console.log == 'function';

    // initialise the channel name
    this.channel = opts.channel || '';

    // if the transport constructor is valid, create the transport
    if (typeof opts.transport == 'function') {
        this.transport = opts.transport(opts);
    }

    // if the autoconnect option is not false, and we have a transport
    // connect on next tick
    if (this.transport && (typeof opts.autoConnect == 'undefined' || opts.autoConnect)) {
        process.nextTick(this.connect.bind(this));
    }

    // create the message parser for this signaller
    this.on('message', createMessageParser(this));

    // when we receive an identity update, update our id
    this.on('join:ok', this._joinChannel.bind(this));
}

util.inherits(Signaller, EventEmitter);
module.exports = Signaller;

/**
## connect(callback)
*/
Signaller.prototype.connect = function(callback) {
    var signaller = this,
        transport = this.transport;

    // create a default callback
    // TODO: make the default callback useful
    callback = callback || function() {};

    // if we don't have a transport, return an error
    if (! transport) {
        return callback(new Error('A transport is required to connect'));
    }

    // check for a connect method
    if (typeof transport.connect != 'function') {
        return callback(new Error('The current transport is invalid (no connect method)'));
    }

    // when we receive the connect:ok event trigger the callback
    this.once('connect:ok', callback.bind(this, null));

    // pipe signaller messages to the transport
    signaller.outbound.pipe(pull.drain(transport.createWriter()));

    // listen for messages from the transport and emit them as messages
    pull(
        transport.createReader(),
        pull.drain(signaller.emit.bind(signaller, 'message'))
    );

    // connect the transport
    transport.connect();
};

/**
## join(name, callback)

Send a join command to the signalling server, indicating that you would like 
to join the current room.  In the current implementation of the rtc.io suite
it is only possible for the signalling client to exist in one room at one
particular time, so joining a new channel will automatically mean leaving the
existing one if already joined.
*/
Signaller.prototype.join = function(name, callback) {
    if (callback) {
        this.once('join:ok', callback);
    }

    return this.send('/join', name);
};

/**
## negotiate(targetId, sdp, callId, type)

The negotiate function handles the process of sending an updated Session
Description Protocol (SDP) description to the specified target signalling
peer.  If this is an established connection, then a callId will be used to 
ensure the sdp is deliver to the correct RTCPeerConnection instance
*/
Signaller.prototype.negotiate = function(targetId, sdp, callId, type) {
    return this.send('/negotiate', targetId, sdp, callId || '', type);
};

/**
## send(data)

Send data across the line
*/
Signaller.prototype.send = function() {
    // get the args and jsonify as required
    var args = [].slice.call(arguments).map(function(arg) {
            return typeof arg == 'object' ? JSON.stringify(arg) : arg;
        });

    this.outbound.push(args.join('|'));

    // chainable
    return this;
};

/* "private" event handlers */

/**
## _joinChannel(channelName)

This is the event handler for the join:ok event
*/
Signaller.prototype._joinChannel = function(channelName) {
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
