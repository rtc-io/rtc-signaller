var test = require('tape');
var createSignaller = require('..');

var runTest = module.exports = function(messenger, peers) {
  var s;

  test('create', function(t) {
    t.plan(2);
    t.ok(s = createSignaller(messenger), 'created');
    t.ok(s.id, 'have id');
  });

  test('announce', function(t) {
    t.plan(1);
    peers.expect(t, '/announce|{"id":"' + s.id + '"}');
    s.announce();
  });

  test('disconnect', function(t) {
    t.plan(1);
    peers.expect(t, '/leave|{"id":"' + s.id + '"}');
    s.leave();
  });

  test('announce with attributes', function(t) {
    t.plan(1);
    peers.expect(t, {
      type: 'announce',
      id: s.id,
      name: 'Bob'
    });

    s.announce({ name: 'Bob' });
  });

  test('announce with different attributes', function(t) {
    t.plan(1);
    peers.expect(t, {
      type: 'announce',
      id: s.id,
      name: 'Fred'
    });

    s.announce({ name: 'Fred' });
  });

  test('disconnect', function(t) {
    t.plan(1);
    peers.expect(t, '/leave|{"id":"' + s.id + '"}');
    s.leave();
  });
};

if (typeof document == 'undefined' && (! module.parent)) {
  var peers = require('./helpers/createPeers')(2);
  runTest(peers.shift(), peers);
}
