var test = require('tape');
var messenger = require('messenger-memory')({ delay: Math.random() * 200 });
var peers = [ messenger, messenger ];
var signaller = require('./helpers/signaller');
var signallers;

test('create signallers', function(t) {
  t.plan(3);
  signallers = peers.map(signaller);
  t.equal(signallers.length, 2);
  t.equal(typeof signallers[0].announce, 'function', 'first signaller');
  t.equal(typeof signallers[1].announce, 'function', 'second signaller');
  t.end();
});

test('filter out announce', function(t) {
  t.plan(5);

  signallers[1].once('peer:filter', function(id, data) {
    t.ok(data, 'Got event data');
    t.equal(id, signallers[0].id, 'got id for peer');
    t.equal(data.name, 'Fred', 'name is as expected');
    t.equal(data.allow, true, 'Allow flag set to true');

    // set allow to false
    data.allow = false;
  });

  signallers[1].once('peer:announce', function(data, srcData) {
    t.fail('should not have received announce message');
  });

  setTimeout(function() {
    t.pass('did not receive announce');
  }, 500);

  // peer 0 initiates the announce process
  signallers[0].announce({ name: 'Fred' });
});
