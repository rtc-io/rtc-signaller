var test = require('tape');
var signaller = require('..');
var roomId = require('uuid').v4();
var sigA;
var sigB;

test('A: can create a signalling instance that automatically connects via primus', function(t) {
  t.plan(1);
  t.ok(sigA = signaller(location.origin), 'signaller created');
});

test('A: can announce prior to the connection being established', function(t) {
  t.plan(1);
  sigA.announce({ name: 'Fred', room: roomId });
  t.pass('Announce called without error');
});

test('A: will receive an open event when channel is open', function(t) {
  t.plan(1);
  sigA.once('connected', t.pass.bind(t, 'signaller open'));
});

test('B: can create a signalling instance that automatically connects via primus', function(t) {
  t.plan(1);
  t.ok(sigB = signaller(location.origin), 'signaller created');
});

test('B: will receive an open event when channel is open', function(t) {
  t.plan(1);
  sigB.once('connected', t.pass.bind(t, 'signaller open'));
});

test('B: can announce prior to the connection being established', function(t) {
  t.plan(5);

  sigA.once('peer:announce', function(data) {
    t.ok(data, 'got data');
    t.equal(data.name, 'Bob', 'Bob announced');
  });

  sigB.once('peer:announce', function(data) {
    t.ok(data, 'got data');
    t.equal(data.name, 'Fred', 'Fred knows about Bob');
  });

  sigB.announce({ name: 'Bob', room: roomId });
  t.pass('Announce called without error');
});

test('disrupt the underlying socket', function(t) {

  function handleFail() {
    t.fail('captured peer:leave which should not have happened on a reconnect');
  }

  t.plan(4);
  sigB.once('peer:leave', t.pass.bind(t, 'captured leave'));
  sigB.once('peer:announce', function(data) {
    t.ok(data, 'got valid data');
    t.equal(data.name, 'Fred', 'Fred reannounced');
  });

  sigA.once('peer:leave', handleFail);
  sigA.once('connected', function() {
    sigA.removeListener('peer:leave', handleFail);
    sigB.removeListener('peer:leave', handleFail);
    t.pass('captured reconnection');
  });

  sigA.send('/fake:disconnect');
});

test('message delivery successful after disconnect', function(t) {
  t.plan(1);

  sigA.once('hello', function() {
    t.pass('got hello message');
  });

  sigB.to(sigA.id).send('/hello');
});