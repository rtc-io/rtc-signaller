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

test('signallers trigger local:announce event', function(t) {
  t.plan(3);

  signallers[0].on('local:announce', function(data) {
    t.equal(data.name, 'Fred', 'signaller 0 announce captured by signaller 1');
  });

  signallers[1].on('local:announce', function(data) {
    t.equal(data.id, signallers[1].id, 'signaller 1 has announced itself in response');
  });

  setTimeout(function() {
    signallers[0].removeAllListeners();
    signallers[1].removeAllListeners();
    t.pass('received only the 1 announce message for each peer');
  }, 1000);

  // peer 0 initiates the announce process
  signallers[0].announce({ name: 'Fred' });
  signallers[1].announce({ name: 'Bob' });
});
