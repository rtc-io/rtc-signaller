var test = require('tape'),
	opts = {
		transport: require('./transports/dummy'),
		channel: 'test'
	}
	signallers = [];

test('create signaller 0', function(t) {
	t.plan(1);

	signallers[0] = require('..')(opts);
	signallers[0].once('join:ok', function() {
		t.equal(signallers[0].channel, 'test');
	});
});