var test = require('tape');
var signaller = require('..');
var uuid = require('cuid');
var signallers = [];
var roomId = uuid();
var signallingServer = require('./helpers/signalling-server');
var times = require('whisk/times');
var pluck = require('whisk/pluck');

test('create signallers', function(t) {
  signallers = times(50).map(function() {
    return signaller(signallingServer);
  });

  t.plan(signallers.length);
  signallers.forEach(function(sig, idx) {
    sig.once('connected', t.pass.bind(t, 'signaller ' + idx + ' connected'));
  });
});

test('concurrent announce', function(t) {
  t.plan(signallers.length);

  signallers.forEach(function(sig) {
    var expected = signallers.map(pluck('id')).filter(function(id) {
      return id !== sig.id;
    });

    function handleAnnounce(data) {
      var idx = expected.indexOf(data.id);

      if (idx >= 0) {
        expected.splice(idx, 1);
      }

      if (expected.length === 0) {
        t.pass(sig.id + ' has received all expected ennounce messages');
        sig.removeListener('peer:announce', handleAnnounce);
      }
    }

    sig.on('peer:announce', handleAnnounce);
    sig.announce();
  });
});

test('close the signallers', function(t) {
  t.plan(signallers.length);
  signallers.forEach(function(signaller, idx) {
    signaller.on('disconnected', t.pass.bind(t, 'signaller ' + idx + ' disconnected'));
    signaller.close();
  });
});
