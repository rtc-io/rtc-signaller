var test = require('tape');
var messenger = require('messenger-memory');
var signaller = require('./helpers/signaller');
var uuid = require('cuid');
var scope = [];
var signallers = [];
var roomId = uuid();

module.exports = function(signallingServer) {
  test('create signaller:0', function(t) {
    t.plan(2);
    t.ok(signallers[0] = require('../')(require('rtc-switchboard-messenger')(signallingServer)), 'created');
    signallers[0].once('connected', t.pass.bind(t, 'connected'));
  });

  test('create signaller:1', function(t) {
    t.plan(2);
    t.ok(signallers[1] = require('../')(require('rtc-switchboard-messenger')(signallingServer)), 'created');
    signallers[1].once('connected', t.pass.bind(t, 'connected'));
  });

  test('announce via signalling server', function(t) {
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
    }, 10000);

    // peer 0 initiates the announce process
    signallers[0].announce({ room: roomId, name: 'Fred' });
    signallers[1].announce({ room: roomId, name: 'Bob' });
  });

  test('close signaller:0', function(t) {
    t.plan(1);
    signallers[0].close();
    signallers[0].once('disconnected', t.pass.bind(t, 'signaller:0 disconnected'));
  });

  test('send from 0 --> 1, reopen 0', function(t) {
    var timer = setTimeout(t.fail.bind(t, 'did not receive message'), 10000);

    t.plan(1);
    signallers[0].send('/hello');
    signallers[1].once('message:hello', function() {
      clearTimeout(timer);
      t.pass('received hello from signaller 0');
    });
  });

  test('close signaller:1', function(t) {
    t.plan(1);
    signallers[1].close();
    signallers[1].once('disconnected', t.pass.bind(t, 'signaller:0 disconnected'));
  });
};
