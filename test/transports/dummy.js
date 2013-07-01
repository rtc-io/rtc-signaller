var EventEmitter = require('events').EventEmitter,
	util = require('util'),
	pushable = require('pull-pushable'),
	ChannelManager = require('rtc-channelmanager');

function DummyTransport(opts) {
	this.channelManager = new ChannelManager();
	this.messages = pushable();
}

util.inherits(DummyTransport, EventEmitter);

DummyTransport.prototype.connect = function() {
	var peer = this.channelManager.connect();

	this.messages.push('connect:ok|' + JSON.stringify(peer));
};

DummyTransport.prototype.createReader = function() {
	return this.messages;
};

DummyTransport.prototype.createWriter = function() {
	var upstream = this.messages;

    return function(data) {
    	console.log(data);
    };
};

module.exports = function(opts) {
	return new DummyTransport(opts);
}