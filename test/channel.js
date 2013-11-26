var test = require('tape');
var signaller = require('..');
var Channel = require('../channel');

var runTest = module.exports = function(peers) {
  var scopes;
  var altScopes;
  var channelA;
  var channelB;

  test('create', function(t) {
    t.plan(peers.length * 3);
    scopes = peers.map(signaller);

    scopes.forEach(function(scope) {
      t.ok(scope, 'created');
      t.ok(scope.id, 'have scope id');
      scope.announce();
      t.pass('announced');
    });
  });

  test('create 0 --> 1 channel (a)', function(t) {
    t.plan(2);
    scopes[0].request({ id: scopes[1].id }, function(err, channel) {
      t.ifError(err, 'no error');
      t.ok(channel instanceof Channel, 'created channel');

      // save channel a
      channelA = channel;
    });
  });

  test('create 1 --> 0 channel (b)', function(t) {
    t.plan(2);
    scopes[1].request({ id: scopes[0].id }, function(err, channel) {
      t.ifError(err, 'no error');
      t.ok(channel instanceof Channel, 'created channel');

      // save channel b
      channelB = channel;
    });
  });

  test('can send message from a to b', function(t) {
    t.plan(1);
    channelB.once('hi', function(data) {
      t.equal(data, 'ho', 'got expected message');
    });

    channelA.send('/hi', 'ho');
  });

  test('can send message from b to a', function(t) {
    t.plan(1);
    channelA.once('ho', function(data) {
      t.equal(data, 'hi', 'got expected message');
    });

    channelB.send('/ho', 'hi');
  });

  // test('announce', function(t) {
  //   t.plan(2);
  //   peers.expect(t, '/announce|{"id":"' + scope.id + '"}');
  //   scope.announce();
  // });

  // test('request', function(t) {
  //   var target = peers.first();

  //   t.plan(1);
  //   target.expect(t, { type: 'request' });
  //   scope.request({ id: peers.first().id });
  // });

  // test('request and handle response', function(t) {
  //   var target = peers.first();

  //   t.plan(3);

  //   target.expect(t, { type: 'request' }, function(data) {
  //     target.send('/to|' + scope.id + '|/ackreq|' + data.__reqid);
  //   });

  //   scope.request({ id: 'doesnotmatter' }, function(err, channel) {
  //     t.ok(channel, 'got channel');
  //     t.equal(typeof channel.send, 'function', 'got a send function');
  //   });
  // });

  // test('convert other peers to signaller scopes', function(t) {
  //   t.plan(peers.length);

  //   altScopes = peers.map(signaller);
  //   altScopes.forEach(function(peer) {
  //     t.ok(typeof altScopes.request, 'function', 'have a request function');
  //   })
  // });

  // test('request and handle response', function(t) {
  //   t.plan(2);
  //   scope.request({ id: altScopes[0].id }, function(err, channel) {
  //     t.ok(channel, 'got channel');
  //     t.equal(typeof channel.send, 'function', 'got a send function');
  //   });
  // });
};

if (typeof document == 'undefined' && (! module.parent)) {
  var peers = require('./helpers/createPeers')(3);
  runTest(peers);
}
