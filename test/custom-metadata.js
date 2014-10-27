var test = require('tape');
var createSignaller = require('../signaller');
var uuid = require('cuid');

var runTest = module.exports = function(group) {
  var s;
  var token = uuid();

  test('create', function(t) {
    t.plan(2);
    t.ok(s = createSignaller(group.messenger), 'created');
    t.ok(s.id, 'have id');
  });

  test('announce', function(t) {
    group.peers.expect(t, ['/announce', { id: s.id } ]);
    s.announce();
  });

  test('update metadata to include a token', function(t) {
    t.plan(1);
    s.metadata({ token: token });
    t.deepEqual(s.metadata(), { token: token }, 'metadata matched expected');
  });

  test('announce with updated metadata', function(t) {
    group.peers.expect(t, ['/announce', { id: s.id, token: token } ]);
    s.announce();
  });

  test('update metadata, overwriting old metadata', function(t) {
    t.plan(1);
    s.metadata({ foo: 'bar' });
    t.deepEqual(s.metadata(), { foo: 'bar' }, 'metadata matched expected');
  });

  test('announce with updated metadata', function(t) {
    group.peers.expect(t, ['/announce', { id: s.id, foo: 'bar' } ]);
    s.announce();
  });

  test('disconnect', function(t) {
    group.peers.expect(t, ['/leave', { id: s.id, foo: 'bar' } ]);
    s.leave();
  });
};

if  (! module.parent) {
  runTest(require('./helpers/messenger-group')(3));
}
