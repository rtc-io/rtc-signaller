var test = require('tape');
var messenger = require('messenger-memory');
var signaller = require('..');
var scope = [];
var peers = [
  messenger({ delay: Math.random() * 200, scope: scope }),
  messenger({ delay: Math.random() * 200, scope: scope })
];
var signallers = [];

// require('cog/logger').enable('*');

test('create signallers', function(t) {
  t.plan(2);

  setTimeout(function() {
    signallers[0] = signaller(peers[0]);
    t.equal(typeof signallers[0].announce, 'function', 'created signaller:0');
  }, Math.random() * 500);

  setTimeout(function() {
    signallers[1] = signaller(peers[1]);
    t.equal(typeof signallers[1].announce, 'function', 'created signaller:1');
  }, Math.random() * 500);
});

test('concurrent announce', function(t) {
  t.plan(5);

  signallers[1].on('peer:announce', function(data) {
    t.equal(data.name, 'Fred', 'signaller 0 announce captured by signaller 1');
    t.ok(signallers[1].peers.get(data.id), 'signaller 1 has noted relationship with signaller 0');
  });

  signallers[0].on('peer:announce', function(data) {
    // once peer:1 has processed peer:0 announce it will respond
    // if it is a new peer
    t.equal(data.id, signallers[1].id, 'signaller 1 has announced itself in response');
    t.ok(signallers[0].peers.get(data.id), 'signaller 0 has noted relationship with signaller 1');
  });

  setTimeout(function() {
    signallers[0].removeAllListeners();
    signallers[1].removeAllListeners();
    t.pass('received only the 1 announce message for each peer');
  }, 1000);

  // peer 0 initiates the announce process
  signallers[0].announce({ name: 'Fred' });
  signallers[1].announce({ name: 'Bob' });
});

test('attempt uncontested lock from peer:0', function(t) {
  t.plan(2);
  signallers[0].lock(signallers[1].id, function(err) {
    t.ifError(err, 'got lock successfully');
    t.ok(signallers[0].locks.get('default'), 'default lock detected');
  });
});

test('unable to acquire default lock from peer:1', function(t) {
  t.plan(1);
  signallers[1].lock(signallers[0].id, function(err) {
    t.ok(err, 'received error as expected');
  });
});

test('peer:0 release the default lock', function(t) {
  t.plan(2);
  signallers[0].unlock(signallers[1].id, function(err) {
    t.ifError(err, 'lock released');
    t.notOk(signallers[0].locks.get('default'), 'no default lock present');
  });
});

test('attempt uncontested lock from peer:1', function(t) {
  t.plan(2);
  signallers[1].lock(signallers[0].id, function(err) {
    t.ifError(err, 'got lock successfully');
    t.ok(signallers[1].locks.get('default'), 'default lock detected');
  });
});

test('unable to acquire default lock from peer:0', function(t) {
  t.plan(1);
  signallers[0].lock(signallers[1].id, function(err) {
    t.ok(err, 'received error as expected');
  });
});

test('peer:0 can acquire an alternatively named lock', function(t) {
  t.plan(3);
  signallers[0].lock(signallers[1].id, { name: 'foo' }, function(err) {
    var localLockId;
    var remoteLockId;

    t.ifError(err, 'got lock successfully');

    // get the local lock id and remote lock id
    localLockId = signallers[0].locks.get('foo');
    remoteLockId = signallers[1].peers.get(signallers[0].id).locks.get('foo');

    t.ok(localLockId, 'local foo lock detected');
    t.equal(remoteLockId, localLockId, 'remote lock id === local lock id');
  });
});

test('peer:1 release the default lock', function(t) {
  t.plan(2);
  signallers[1].unlock(signallers[0].id, function(err) {
    t.ifError(err, 'lock released');
    t.notOk(signallers[1].locks.get('default'), 'no default lock present');
  });
});

// test('contested lock results in alpha party getting lock', function(t) {
//   var ids = [ signallers[0].id, signallers[1].id ];
//   var alphaIndex = ids.indexOf([].concat(ids).sort()[0]);

//   t.plan(2);
//   signallers[0].lock(signallers[1].id, function(err) {
//     if (alphaIndex === 0) {
//       t.ifError(err, 'signaller 0 was alpha and got lock');
//     }
//     else {
//       t.ok(err, 'signaller 0 was beta and did not get lock');
//     }
//   });

//   signallers[1].lock(signallers[0].id, function(err) {
//     if (alphaIndex === 1) {
//       t.ifError(err, 'signaller 1 was alpha and got lock');
//     }
//     else {
//       t.ok(err, 'signaller 1 was beta and did not get lock');
//     }
//   });
// });