var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    pull = require('pull-stream'),
    pushable = require('pull-pushable'),
	reTrailingSlash = /^(.*)\/?$/;

function SocketConnection(opts) {
    if (! (this instanceof SocketConnection)) {
        return new SocketConnection(opts);
    }

    // ensure we have opts
    opts = opts || {};

    // initialise the default host
    opts.host = opts.host || 'http://rtc.io/';

    // initialise the target uri
	this.targetURI = opts.host
        	.replace(reTrailingSlash, '$1/rtc-signaller')
        	.replace(/^http/, 'ws');


    // create the messages pushable
    this.messages = pushable();

    // set the socket to null
    this.socket = null;
}

util.inherits(SocketConnection, EventEmitter);
module.exports = SocketConnection;

/** 
## createReader()
*/
SocketConnection.prototype.createReader = function() {
    return this.messages;
};

/**
## createWriter()

Create a writer function that will be used to write data to the socket.
*/
SocketConnection.prototype.createWriter = function() {
    var conn = this;

    return function writeData(data) {
        var socket = conn.socket;

        // if we don't have a socket (or an unopened socket)
        // wait until open
        if ((! socket) || socket.readyState !== WebSocket.OPEN) {
            return conn.once('open', writeData.bind(this, data));
        }

        // send the data
        socket.send(data);
    };
};

/**
## connect(callback)

Connect to the server, once connected trigger the callback
*/
SocketConnection.prototype.connect = function() {
    var messages = this.messages;

    // initialise the socket
    this.socket = new WebSocket(this.targetURI);

    // once the socket is open, emit an open event
    this.socket.addEventListener('open', this.emit.bind(this, 'open'));

    // when we receive a message, push to the upstream queue
    this.socket.addEventListener('message', function(evt) {
        messages.push(evt.data);
    });

    // TODO: handle socket close events and intelligentally reconnect if required
    this.socket.addEventListener('close', function() {
        messages.end();
    });
};