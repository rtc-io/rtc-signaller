var test = require('tape');
var signaller = require('./helpers/signaller');
var uuid = require('cuid');
var sigA;
var sigB;

module.exports = function(signallingServer) {
  test('connect signaller', function(t) {
    t.plan(2);
    t.ok(sigA = signaller(require('rtc-switchboard-messenger')(signallingServer)), 'signaller created');
    sigA.announce({ name: 'Fred', room: uuid() });
    sigA.once('connected', t.pass.bind(t, 'signaller open'));
  });

  test('signaller.leave(), receive disconnect event', function(t) {
    t.plan(1);
    sigA.once('disconnected', t.pass.bind(t, 'disconnected'));
    sigA.leave();
  });

  test('reconnect signaller', function(t) {
    t.plan(2);
    t.ok(sigA = signaller(require('rtc-switchboard-messenger')(signallingServer)), 'signaller created');
    sigA.announce({ name: 'Fred', room: uuid() });
    sigA.once('connected', t.pass.bind(t, 'signaller open'));
  });

  test('signaller.close(), receive disconnect event', function(t) {
    t.plan(1);
    sigA.once('disconnected', t.pass.bind(t, 'disconnected'));
    sigA.close();
  });
}
