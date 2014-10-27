var extend = require('cog/extend');
var test = require('tape');
var createSignaller = require('../signaller');

var runTest = module.exports = function(group) {
  var s;

  test('create', function(t) {
    t.plan(2);
    t.ok(s = createSignaller(group.messenger), 'created');
    t.ok(s.id, 'have id');
  });

  test('announce', function(t) {
    group.peers.expect(t, ['/announce', {id: s.id } ]);
    s.announce();
  });

  test('can send simple message', function(t) {
    group.peers.expect(t, ['/hi', { id: s.id } ]);
    s.send('/hi');
  });

  test('can send message with 0 as arguments', function(t) {
    group.peers.expect(t, ['/value', { id: s.id }, 0]);
    s.send('/value', 0);
  });

  test('can send message with empty string as arguments', function(t) {
    group.peers.expect(t, ['/message', { id: s.id }, '']);
    s.send('/message', '');
  });

  test('can send message with value false as argument', function(t) {
    group.peers.expect(t, ['/connected', { id: s.id }, false ]);
    s.send('/connected', false);
  });
};

if (! module.parent) {
  runTest(require('./helpers/messenger-group')(3));
}
