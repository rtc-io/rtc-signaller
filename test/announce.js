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

  test('disconnect', function(t) {
    peers.expect(t, '/leave {"id":"' + signaller.id + '"}');
    signaller.leave();
  });

  test('announce with attributes', function(t) {
    peers.expect(t, {
      type: 'announce',
      id: signaller.id,
      name: 'Bob'
    });

    signaller.announce({ name: 'Bob' });
  });

  test('announce with different attributes', function(t) {
    peers.expect(t, {
      type: 'announce',
      id: signaller.id,
      name: 'Fred'
    });

    signaller.announce({ name: 'Fred' });
  });

  test('disconnect', function(t) {
    peers.expect(t, '/leave {"id":"' + signaller.id + '"}');
    signaller.leave();
  });
};

