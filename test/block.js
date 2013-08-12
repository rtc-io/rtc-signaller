var test = require('tape');
var signaller = require('..');

var runTest = module.exports = function(messenger, peers) {
  var scope;
  var altScopes;

  test('create', function(t) {
    t.plan(2);
    t.ok(scope = signaller(messenger), 'created');
    t.ok(scope.id, 'have id');
  });

  test('convert other peers to signaller scopes', function(t) {
    t.plan(peers.length);

    altScopes = peers.map(signaller);
    altScopes.forEach(function(peer) {
      t.ok(typeof altScopes.request, 'function', 'have a request function');
    })
  });

  test('request and handle response', function(t) {
    t.plan(2);
    scope.request({ id: peers.first().id }, function(err, channel) {
      t.ok(channel, 'got channel');
      t.equal(typeof channel.send, 'function', 'got a send function');
    });
  });
};

if (typeof document == 'undefined' && (! module.parent)) {
  var peers = require('./helpers/createPeers')(2);
  runTest(peers.shift(), peers);
}
