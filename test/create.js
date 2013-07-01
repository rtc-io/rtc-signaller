var test = require('tape'),
	uuid = require('uuid'),
	signaller;

function isEmpty(b) {
	return b.filter(function(part) {
		return part === 0;
	}).length === 16;
}

test('create a new signaller', function(t) {
	t.plan(2);

	// create a test signaller (using the dummy transport)
	signaller = require('..')({
		transport: require('./transports/dummy'),
		autoConnect: false
	});

	// ensure we have a new signaller
	t.ok(signaller, 'signaller was successfully created');

	// ensure the channel is empty
	t.equal(signaller.channel, '', 'Signaller has not joined a channel');
});

test('should be able to connect the signaller', function(t) {
	t.plan(1);

	signaller.connect(function(err) {
		t.error(err);
	});
});

test('should be able to change the signaller channel', function(t) {
	t.plan(1);
	signaller.join('test', function(err) {
		t.equal(signaller.channel, 'test', 'Signaller has joined the test channel');
	});
});