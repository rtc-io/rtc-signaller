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

test('debounce announce', function(t) {
  var cappedAnnounce = false;

  function handleAnnounce(data) {
    if (cappedAnnounce) {
      return t.fail('only expecting a single announce')
    }

    t.ok(data, 'got data');
    t.equal(data.name, 'Fred', 'name matches expected');
    t.equal(data.age, 80, 'age matches expected');
    cappedAnnounce = true;
  }

  function handleUpdate(data) {
    t.fail('should not have received update');
  }

  t.plan(4);

  setTimeout(function() {
    t.pass('only a single announce message received');
    signallers[1].removeListener('peer:announce', handleAnnounce);
    signallers[1].removeListener('peer:update', handleUpdate);
  }, 500);

  signallers[1].on('peer:announce', handleAnnounce);
  signallers[1].on('peer:update', handleUpdate);
  signallers[0].announce({ name: 'Fred' });
  signallers[0].announce({ name: 'Fred', age: 80 });
});

test('announce after debounce timeout sent normally', function(t) {
  t.plan(4);

  signallers[1].once('peer:update', function(data) {
    t.ok(data, 'got data');
    t.equal(data.name, 'Fred', 'name matches');
    t.equal(data.age, 80, 'age matches');
    t.equal(data.country, 'AU', 'country');
  });

  signallers[0].announce({ country: 'AU' });
});
