var test = require('tape');
var Signaller = require('..');

module.exports = function(messenger, peers) {
  var signaller;

  test('create', function(t) {
    t.plan(2);
    t.ok(signaller = new Signaller(messenger), 'created');
    t.ok(signaller.id, 'have id');
  });

  test('announce', function(t) {
    peers.expect(t, '/announce {"id":"' + signaller.id + '"}');
    signaller.announce();
  });

  test('request dialog', function(t) {
    peers.head().expect(t, {
      type: 'request'
    });

    signaller.request({ id: peers.head().id });
  });
};

