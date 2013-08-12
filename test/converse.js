var test = require('tape');
var signaller = require('..');

var runTest = module.exports = function(messenger, peers) {
  var scope;

  test('create', function(t) {
    t.plan(2);
    t.ok(scope = signaller(messenger), 'created');
    t.ok(scope.id, 'have id');
  });

  test('announce', function(t) {
    peers.expect(t, '/announce|{"id":"' + scope.id + '"}');
    scope.announce();
  });

  test('request dialog', function(t) {
    var target = peers.first();

    target.expect(t, { type: 'request' });
    scope.request({ id: peers.first().id });
  });

  test('request dialog and handle response', function(t) {
    var target = peers.first();

    t.plan(1);
    target.expect(t, { type: 'request' }, function(data) {
      messenger.emit('data', '/to|' + scope.id + '|/ackreq|' + data.__reqid);
    });

    scope.request({ id: peers.first().id }, function(err, channel) {
      t.ok(channel, 'got channel');
    });
  });
};

if (typeof document == 'undefined' && (! module.parent)) {
  var peers = require('./helpers/createPeers')(2);
  runTest(peers.shift(), peers);
}
