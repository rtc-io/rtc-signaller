var test = require('tape');
var signaller = require('..');
var roomId = require('../uuid')();
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
    t.fail('captured peer:disconnected which should not have happened on a reconnect');
  }

  t.plan(4);
  sigB.once('peer:disconnected', t.pass.bind(t, 'captured disconnected'));
  sigB.once('peer:connected', function(id, data) {
    t.equal(id, sigA.id, 'Fred reconnected');
  });

  sigA.once('peer:disconnected', handleFail);
  sigA.once('connected', function() {
    sigA.removeListener('peer:disconnected', handleFail);
    sigB.removeListener('peer:disconnected', handleFail);
    t.pass('captured reconnection');
  });

  sigA.once('disconnected', t.pass.bind(t, 'captured disconnect on signaller A'));
  sigA.send('/fake:disconnect');
});

test('message delivery successful after disconnect', function(t) {
  t.plan(1);

  sigA.once('hello', function() {
    t.pass('got hello message');
  });

  sigB.to(sigA.id).send('/hello');
});

test('disrupt the underlying socket (no reconnection attempt)', function(t) {
  t.plan(3);
  sigB.once('peer:disconnected', t.pass.bind(t, 'captured disconnected'));
  sigB.once('peer:leave', t.pass.bind(t, 'captured leave'));
  sigA.once('disconnected', t.pass.bind(t, 'captured disconnect on signaller A'));
  sigA.send('/fake:leave');
});
