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

  test('block prevents request response', function(t) {
    var passed;

    blockId = altScopes[0].block();

    t.plan(2);
    t.equal(altScopes[0].blocks.length, 1, 'have one active block');
    scope.request({ id: altScopes[0].id }, function(err, channel) {
      // if this test has already passed, then go through
      if (passed) return;

      t.fail('should not have received request response');
    });

    setTimeout(function() {
      passed = true;
      t.pass('did not ack request');
    }, 500);
  });

  test('clear the block', function(t) {
    t.plan(2);
    altScopes[0].once('unblock', function() {
      t.pass('got unblock event');
    });

    altScopes[0].clearBlock(blockId);
    t.equal(altScopes[0].blocks.length, 0, '0 active blocks');
  });

  test('request completes after block is cleared', function(t) {
    blockId = altScopes[0].block();

    t.plan(2);
    t.equal(altScopes[0].blocks.length, 1, 'have one active block');
    scope.request({ id: altScopes[0].id }, function(err, channel) {
      t.pass('got request');
    });

    setTimeout(function() {
      altScopes[0].clearBlock(blockId);
    }, 500);
  });  
};

if (typeof document == 'undefined' && (! module.parent)) {
  var peers = require('./helpers/createPeers')(2);
  runTest(peers.shift(), peers);
}
