var test = require('tape');
var createSignaller = require('..');
var uuid = require('uuid');

var runTest = module.exports = function(messenger, peers) {
  var s;
  var altScopes;

  test('create', function(t) {
    t.plan(2);
    t.ok(s = createSignaller(messenger), 'created');
    t.ok(s.id, 'have id');
  });

  test('change the signaller id', function(t) {
    t.plan(1);
    s.id = uuid.v4();
    t.pass('signaller id updated');
  });

  test('convert other peers to signaller scopes', function(t) {
    t.plan(peers.length);

    altScopes = peers.map(createSignaller);
    altScopes.forEach(function(peer) {
      t.ok(typeof altScopes.request, 'function', 'have a request function');
    })
  });

  test('targeted announce', function(t) {
    t.plan(1);
    peers.first().expect(t, '/to|' + altScopes[0].id + '|/announce|{"id":"' + s.id + '"}');
    s.to(altScopes[0].id).announce();
  });

  test('targetted announce captured at the scope level', function(t) {
    t.plan(2);

    function announceOne(data) {
      t.deepEqual({ id: s.id }, data);
    }

    function announceTwo(data) {
      t.fail('should not have captured data');
    }

    altScopes[0].once('announce', announceOne);
    altScopes[1].once('announce', announceTwo);

    setTimeout(function() {
      altScopes[1].removeListener('announce', announceTwo);
      t.pass('did not capture announce event at second scope');
    }, 500);

    s.to(altScopes[0].id).announce();
  });

  test('disconnect', function(t) {
    t.plan(2);
    peers.expect(t, '/leave|{"id":"' + s.id + '"}');
    s.leave();
  });
};

if (typeof document == 'undefined' && (! module.parent)) {
  var peers = require('./helpers/createPeers')(3);
  runTest(peers.shift(), peers);
}
