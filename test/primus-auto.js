var test = require('tape');
var signaller = require('..');
var sig;

test('can create a signalling instance that automatically connects via primus', function(t) {
  t.plan(1);
  t.ok(sig = signaller(location.origin), 'signaller created');
});

test('can announce prior to the connection being established', function(t) {
  t.plan(1);
  sig.announce({ name: 'Fred' });
  t.pass('Announce called without error');
});

test('will receive an open event when channel is open', function(t) {
  t.plan(1);
  sig.once('open', t.pass.bind(t, 'signaller open'));
});