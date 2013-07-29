var test = require('tape');
var SocketProxy = require('../transport-socket');

test('converts http to ws', function(t) {
  var proxy;

  t.plan(1);
  proxy = SocketProxy({ host: 'http://rtc.io' });

  t.equal(proxy.host, 'ws://rtc.io/rtc-signaller');
});

test('converts https to wss', function(t) {
  var proxy;

  t.plan(1);
  proxy = SocketProxy({ host: 'https://rtc.io' });

  t.equal(proxy.host, 'wss://rtc.io/rtc-signaller');
});

test('strips trailing slashes', function(t) {
  var proxy;

  t.plan(1);
  proxy = SocketProxy({ host: 'http://rtc.io/' });

  t.equal(proxy.host, 'ws://rtc.io/rtc-signaller');
});

