var extend = require('cog/extend');
var test = require('tape');
var createSignaller = require('../signaller');

var runTest = module.exports = function(messenger, peers) {
  var s;

  test('create', function(t) {
    t.plan(2);
    t.ok(s = createSignaller(messenger), 'created');
    t.ok(s.id, 'have id');
  });

  test('announce', function(t) {
    peers.expect(t, ['/announce', {id: s.id } ]);
    s.announce();
  });

  test('can send simple message', function(t) {
    peers.expect(t, ['/hi', { id: s.id } ]);
    s.send('/hi');
  });

  test('can send message with 0 as arguments', function(t) {
    peers.expect(t, ['/value', { id: s.id }, 0]);
    s.send('/value', 0);
  });

  test('can send message with empty string as arguments', function(t) {
    peers.expect(t, ['/message', { id: s.id }, '']);
    s.send('/message', '');
  });

  test('can send message with value false as argument', function(t) {
    peers.expect(t, ['/connected', { id: s.id }, false ]);
    s.send('/connected', false);
  });
};

if (! module.parent) {
  var peers = require('./helpers/createPeers')(3);
  runTest(peers.shift(), peers);
}
