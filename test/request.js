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

  test('announce', function(t) {
    t.plan(2);
    peers.expect(t, '/announce|{"id":"' + scope.id + '"}');
    scope.announce();
  });

  test('request', function(t) {
    var target = peers.first();

    t.plan(1);
    target.expect(t, { type: 'request' });
    scope.request({ id: peers.first().id });
  });

  test('request and handle response', function(t) {
    var target = peers.first();

    t.plan(3);

    target.expect(t, { type: 'request' }, function(data) {
      target.send('/to|' + scope.id + '|/ackreq|' + data.__reqid);
    });

    scope.request({ id: 'doesnotmatter' }, function(err, channel) {
      t.ok(channel, 'got channel');
      t.equal(typeof channel.send, 'function', 'got a send function');
    });
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
    scope.request({ id: altScopes[0].id }, function(err, channel) {
      t.ok(channel, 'got channel');
      t.equal(typeof channel.send, 'function', 'got a send function');
    });
  });

  test('request fails when a channel is already active', function(t) {
    t.plan(1);
    scope.request({ id: altScopes[0].id }, function(err) {
      t.ok(err instanceof Error, 'got expected error');
    })
  });

  test('can close a channel using the target id', function(t) {
    t.plan(1);
    scope.closeChannel(altScopes[0].id);
    t.pass('call succeeded');
  });

  test('can now request a new channel', function(t) {
    t.plan(2);
    scope.request({ id: altScopes[0].id }, function(err, channel) {
      t.ok(channel, 'got channel');
      t.equal(typeof channel.send, 'function', 'got a send function');
      scope.closeChannel(channel);
    });
  });
};

if (typeof document == 'undefined' && (! module.parent)) {
  var peers = require('./helpers/createPeers')(3);
  runTest(peers.shift(), peers);
}