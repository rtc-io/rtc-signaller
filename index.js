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
    this.channel = '';

    // if the transport constructor is valid, create the transport
    if (typeof opts.transport == 'function') {
        this.transport = opts.transport(opts);
    }

    // if the autoconnect option is not false, and we have a transport
    // connect on next tick
    if (typeof opts.autoConnect == 'undefined' || opts.autoConnect) {
        process.nextTick(this._autoConnect.bind(this, opts));
    }
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
    this.once('connect:ok', function(data) {
        // update the signaller id
        signaller.id = data.id;

        // trigger the callback
        callback(null, data);
    });

    // pipe signaller messages to the transport
    signaller.outbound.pipe(pull.drain(transport.createWriter()));

    // listen for messages from the transport and emit them as messages
    pull(
        transport.createReader(),
        pull.drain(createMessageParser(signaller))
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
    var signaller = this;

    // handle the pre:join:ok handler and update the channel name
    this.once('pre:join:ok', function(newChannel) {
        signaller.channel = newChannel;
    });

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

/* internals */

/**
## _autoConnect(opts)
*/
Signaller.prototype._autoConnect = function(opts) {
    // if we have no transport, abort
    if (! this.transport) return;

    // connect
    this.connect();

    // if a channel has been specified, then update the channel name
    if (opts.channel) {
        this.join(opts.channel);
    }
};

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
            evtName = (parts[0] || '').toLowerCase(),
            args = parts.slice(1).map(function(arg) {
                // if it looks like JSON then parse it
                return ['{', '['].indexOf(arg.charAt(0)) >= 0 ? JSON.parse(arg) : arg;
            });

        if (signaller.debug) {
            console.log('<-- ' + data);
        }

        // trigger the event
        if (evtName) {
            // trigger the message pre-processor
            signaller.emit.apply(signaller, ['pre:' + evtName].concat(args));

            // trigger the main processor
            if (! signaller.emit.apply(signaller, [evtName].concat(args))) {
                // if not handled by a specific message parser then emit
                // as a raw message for something else to handle (potentially)
                signaller.emit('message', data);
            }
        }

        // TODO: emit a data event regardless of being handled, evtName, etc?
    };
}
