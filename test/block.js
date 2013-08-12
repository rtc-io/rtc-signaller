var test = require('tape');
var signaller = require('..');

var runTest = module.exports = function(messenger, peers) {
  var scope;
  var altScopes;
  var blockId;

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

  test('request and handle response (wait for block to clear)', function(t) {
    blockId = altScopes[0].block();

    t.plan(2);
    t.equal(altScopes[0].blocks.length, 1, 'have one active block');
    scope.request({ id: altScopes[0].id }, function(err, channel) {
      t.fail('should not have received request response');
    });

    setTimeout(function() {
      t.pass('did not ack request');
      t.end();
    }, 500);
  });

  test('clear the block', function(t) {
    t.plan(1);
    altScopes[0].clearBlock(blockId);
    t.equal(altScopes[0].blocks.length, 0, '0 active blocks');
  });
};

if (typeof document == 'undefined' && (! module.parent)) {
  var peers = require('./helpers/createPeers')(2);
  runTest(peers.shift(), peers);
}
