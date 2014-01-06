var test = require('tape');
var messenger = require('messenger-memory');
var signaller = require('..');
var scope = [];
var peers = [
  messenger({ delay: Math.random() * 200, scope: scope }),
  messenger({ delay: Math.random() * 200, scope: scope })
];
var signallers;

test('create signallers', function(t) {
  t.plan(3);
  signallers = peers.map(signaller);
  t.equal(signallers.length, 2);
  t.equal(typeof signallers[0].announce, 'function', 'first signaller');
  t.equal(typeof signallers[1].announce, 'function', 'second signaller');
  t.end();
});

test('peer:0 announce', function(t) {
  t.plan(6);

  signallers[1].once('peer:announce', function(data) {
    t.equal(data.name, 'Fred', 'signaller 0 announce captured by signaller 1');
    t.ok(signallers[1].peers.get(data.id), 'signaller 1 has noted relationship with signaller 0');

    t.ok(data.browser, 'browser name has been supplied in announce');
    t.ok(data.browserVersion, 'browser version has been supplied in announce');
  });

  signallers[0].once('peer:announce', function(data) {
    // once peer:1 has processed peer:0 announce it will respond
    // if it is a new peer
    t.equal(data.id, signallers[1].id, 'signaller 1 has announced itself in response');
    t.ok(signallers[0].peers.get(data.id), 'signaller 0 has noted relationship with signaller 1');
  });

  // peer 0 initiates the announce process
  signallers[0].announce({ name: 'Fred' });
});

test('ab roles have been correctly assigned', function(t) {
  var data0;
  var data1;

  t.plan(4);
  t.ok(data0 = signallers[1].peers.get(signallers[0].id), 'got data for peer 0');
  t.ok(data1 = signallers[0].peers.get(signallers[1].id), 'got data for peer 1');

  // ensure that data0 and data1 have inverse relationships for local and remote
  t.equal(data0.remote, data1.local, 'data 0 remote === data 1 local');
  t.equal(data1.local, data0.remote, 'data 1 local === data 0 remote');
});

test('second peer:0 announce triggers peer:update event only', function(t) {
  var failTest = t.fail.bind(t, 'captured announce');

  t.plan(2);

  signallers[1].once('peer:announce', failTest);
  signallers[1].once('peer:update', function(data) {
    signallers[1].removeListener('peer:announce', failTest);

    t.equal(data.name, 'Fred', 'name retransmitted');
    t.equal(data.age, 30, 'age transmitted also');
  });

  signallers[0].announce({ age: 30 });
});

test('info for peer:0 updated in signaller:1', function(t) {
  var peer;

  t.plan(3);
  t.ok(peer = signallers[1].peers.get(signallers[0].id), 'got peer data');
  t.equal(peer.data.name, 'Fred', 'name is Fred');
  t.equal(peer.data.age, 30, 'age = 30');
});

test('signaller:1 receives a peer:leave event when signaller:0 leaves', function(t) {
  t.plan(4);

  signallers[1].once('peer:leave', function(id, peer) {
    t.equal(id, signallers[0].id, 'captured signaller:0 leave');
    t.ok(peer && peer.data, 'received peer data as this was a known peer');
    t.equal(peer.data.name, 'Fred', 'we know its Fred');

    t.ok(signallers[1].peers.get(id).inactive, 'peer record marked inactive');
  });

  signallers[0].leave();
});