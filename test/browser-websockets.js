var test = require('tape');
var signaller = require('..');
var url = require('url');
var uuid = require('cuid');
var parts = url.parse(location.origin);
var wsUrl = 'ws' + parts.protocol.slice(4) + '//' + parts.host + '/primus';
var socket;
var sig;

test('can create a new websocket connection to test server', function(t) {
  t.plan(1);
  socket = new WebSocket(wsUrl);
  t.ok(socket instanceof WebSocket, 'websocket created');
});

test('socket opens successfully', function(t) {
  t.plan(1);
  socket.onopen = t.pass.bind(t, 'opened');
});

test('close the socket', function(t) {
  t.plan(1);
  socket.close();
  t.pass('socket closed');
});

test('create a new socket', function(t) {
  t.plan(1);
  socket = new WebSocket(wsUrl);
  t.ok(socket instanceof WebSocket, 'websocket created');
});

test('create a new signaller wrapping the socket, wait for open', function(t) {
  t.plan(1);
  sig = signaller(socket);
  sig.once('open', t.pass.bind(t, 'signaller ready'));
});

test('can announce in a test room', function(t) {
  var roomId = uuid();

  t.plan(3);
  sig.once('roominfo', function(data) {
    t.ok(data, 'got data');
    t.equal(data.memberCount, 1, 'room has one member');
  });

  sig.announce({ room: roomId });
  t.pass('successfully called announce function');
});

test('close the socket', function(t) {
  t.plan(1);
  socket.close();
  t.pass('socket closed');
});
