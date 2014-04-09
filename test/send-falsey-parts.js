var extend = require('cog/extend');
var test = require('tape');
var createSignaller = require('..');

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
};

if (! module.parent) {
  var peers = require('./helpers/createPeers')(3);
  runTest(peers.shift(), peers);
}
