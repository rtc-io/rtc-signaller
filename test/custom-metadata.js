var test = require('tape');
var createSignaller = require('..');
var uuid = require('uuid');

var runTest = module.exports = function(messenger, peers) {
  var s;
  var token = uuid.v4();

  test('create', function(t) {
    t.plan(2);
    t.ok(s = createSignaller(messenger), 'created');
    t.ok(s.id, 'have id');
  });

  test('announce', function(t) {
    peers.expect(t, ['/announce', {id: s.id } ]);
    s.announce();
  });

  test('update metadata to include a token', function(t) {
    t.plan(1);
    s.metadata({ token: token });
    t.deepEqual(s.metadata(), { token: token }, 'metadata matched expected');
  });

  test('announce with updated metadata', function(t) {
    peers.expect(t, ['/announce', { id: s.id, token: token } ]);
    s.announce();
  });

  test('update metadata, overwriting old metadata', function(t) {
    t.plan(1);
    s.metadata({ foo: 'bar' });
    t.deepEqual(s.metadata(), { foo: 'bar' }, 'metadata matched expected');
  });

  test('announce with updated metadata', function(t) {
    peers.expect(t, ['/announce', { id: s.id, foo: 'bar' } ]);
    s.announce();
  });

  test('disconnect', function(t) {
    peers.expect(t, ['/leave', { id: s.id, foo: 'bar' } ]);
    s.leave();
  });
};

if  (! module.parent) {
  var peers = require('./helpers/createPeers')(3);
  runTest(peers.shift(), peers);
}