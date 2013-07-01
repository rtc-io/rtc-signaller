var pushable = require('pull-pushable'),
	channelManager = require('rtc-channelmanager')();

function DummyTransport(opts) {
	this.messages = pushable();
	this.peer = null;
}

DummyTransport.prototype.connect = function() {
	var peer = this.peer = channelManager.connect();

	channelManager.messages.on(
		'to.' + peer.id,
		this.messages.push.bind(this.messages)
	);
};

DummyTransport.prototype.createReader = function() {
	return this.messages;
};

DummyTransport.prototype.createWriter = function() {
	var transport = this;

    return function(data) {
    	channelManager.process(transport.peer, data);
    };
};

module.exports = function(opts) {
	return new DummyTransport(opts);
}