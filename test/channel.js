var test = require('tape');
var signaller = require('..');
var Channel = require('../channel');
var WriteLock = require('../writelock');

var runTest = module.exports = function(peers) {
  var scopes;
  var altScopes;
  var channelA;
  var channelB;
  var writeLock;

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

  test('can aquire a namespace lock', function(t) {
    t.plan(2);
    channelA.writeLock(function(err, lock) {
      t.ifError(err, 'write lock acquired');
      t.ok(lock instanceof WriteLock, 'valid writelock');

      // save a reference to the lock
      writeLock = lock;
    });
  });

  test('cannot acquire another forward lock', function(t) {
    t.plan(1);
    channelA.writeLock(function(err) {
      t.ok(err instanceof Error, 'got expected error');
    });
  });

  test('cannot acquire a reverse lock', function(t) {
    t.plan(1);
    channelB.writeLock(function(err) {
      t.ok(err instanceof Error, 'got expected error');
    });
  });

  test('releasing the lock triggers a writelock:release event', function(t) {
    t.plan(3);
    channelB.once('writelock:release', function() {
      t.pass('got writelock:release event');
      t.equal(channelB.lock, null, 'channel b lock removed');
      t.equal(channelA.lock, null, 'channel a lock removed');
    });

    writeLock.release();
    writeLock = null;
  });

  test('can acquire a reverse lock', function(t) {
    t.plan(2);
    channelB.writeLock(function(err, lock) {
      t.ifError(err, 'acquired reverse lock');
      t.ok(lock instanceof WriteLock);

      writeLock = lock;
    });
  });

  test('can release the reverse lock', function(t) {
    t.plan(1);
    channelA.once('writelock:release', function() {
      t.pass('got writelock:release event');
    });

    writeLock.release();
    writeLock = null;
  });

  test('attempting to create concurrent locks will result in one successful lock', function(t) {
    t.plan(3);

    channelA.writeLock(function(err, lock) {
      if ((! channelB.lock.id) || channelA.lock.id > channelB.lock.id) {
        t.ifError(err, 'no error');
        t.ok(lock instanceof WriteLock, 'a got lock');
      }
      else {
        t.ok(err instanceof Error, 'got error as expected (b locked)');
      }
    });

    channelB.writeLock(function(err, lock) {
      if ((! channelA.lock.id) || channelB.lock.id > channelA.lock.id) {
        t.ifError(err, 'no error');
        t.ok(lock instanceof WriteLock, 'b got lock');
      }
      else {
        t.ok(err instanceof Error, 'got error as expected (a locked)');
      }
    });
  });

  test('ping from a', function(t) {
    t.plan(1);
    channelA.ping(function(err) {
      t.ifError(err, 'ping ok');
    });
  });

  test('ping from b', function(t) {
    t.plan(1);
    channelB.ping(function(err) {
      t.ifError(err, 'ping ok');
    });
  });

  test('close b', function(t) {
    t.plan(1);
    scopes[1].closeChannel(channelB);
    t.pass('b closed');
  });

  test('ping from a times out', function(t) {
    t.plan(1);
    channelA.ping(function(err) {
      t.ok(err instanceof Error, 'timed out as expected');
    });
  });
};

if (typeof document == 'undefined' && (! module.parent)) {
  var peers = require('./helpers/createPeers')(3);
  runTest(peers);
}
