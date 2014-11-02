var test = require('tape');
var messenger = require('messenger-memory')();
var signaller = require('./helpers/signaller');
var times = require('whisk/times');
var pluck = require('whisk/pluck');
var roomId = require('cuid')();
var signallers;

test('/to tests: create signallers', function(t) {
  t.plan(1);
  signallers = times(5).map(function() {
    return signaller(messenger);
  });

  t.equal(signallers.length, 5, 'created signallers');
});

test('/to tests: concurrent announce', function(t) {
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
    sig.announce({ room: roomId });
  });
});

test('/to tests: send message from 0 --> 1', function(t) {
  var timer = setTimeout(function() {
    signallers.slice(2).forEach(function(s) {
      s.removeListener('message:hello', handleBadMessage);
    });

    t.pass('no other signallers received the message');
  }, 500);

  function handleBadMessage() {
    t.fail('received hello when should not have');
  }

  t.plan(2);

  signallers[1].once('message:hello', function() {
    t.pass('signaller:1 received hello');
  });

  signallers.slice(2).forEach(function(s) {
    s.on('message:hello', handleBadMessage);
  });

  signallers[0].to(signallers[1].id).send('/hello');
});

