var pull = require('pull-stream'),
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

    // set the socket to null
    this.socket = null;
}

module.exports = SocketConnection;

/** 
## createReader()
*/
SocketConnection.prototype.createReader = function() {
	var messages = pushable();

    this.socket.addEventListener('message', function(evt) {
        messages.push(evt.data);
    });

    this.socket.addEventListener('close', function() {
        messages.end();
    });

    // if we do not have the reader already created, create it now
    return messages;
};

/**
## createWriter()

Create a writer function that will be used to write data to the socket.
*/
SocketConnection.prototype.createWriter = function() {
    var socket = this.socket;

    return function(data) {
        // send the data to the socket
        // TODO: handle when the socket is not open
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(data);
        }
    };
};

/**
## connect(callback)

Connect to the server, once connected trigger the callback
*/
SocketConnection.prototype.connect = function(callback) {
    // initialise the socket
    var socket = this.socket = new WebSocket(this.targetURI);

    // create a dummy callback if none specified
    callback = callback || function() {};

    // handle socket open events
    socket.addEventListener('open', function handleOpen() {
        socket.removeEventListener('open', handleOpen);

        // trigger the callback
        callback();
    });

    // TODO: handle errors connecting
};