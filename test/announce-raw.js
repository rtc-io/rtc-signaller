var extend = require('cog/extend');
var test = require('tape');
var createSignaller = require('..');
var version = require('../package.json').version;
var detect = require('rtc-core/detect');

var runTest = module.exports = function(messenger, peers) {
  var s;

  function genAnnounce(data) {
    return extend({}, data, {
      // FIX THIS
      agent: 'signaller@' + version,
      browser: detect.browser,
      browserVersion: detect.browserVersion,
      id: s.id
    });
  }

  test('create', function(t) {
    t.plan(2);
    t.ok(s = createSignaller(messenger), 'created');
    t.ok(s.id, 'have id');
  });

  test('announce', function(t) {
    peers.expect(t, ['/announce', {id: s.id } ]);
    s.announce();
  });

  test('disconnect', function(t) {
    peers.expect(t, ['/leave', { id: s.id } ]);
    s.leave();
  });

  test('announce with attributes', function(t) {
    peers.expect(t, ['/announce', { id: s.id }, genAnnounce({ name: 'Bob' }) ]);
    s.announce({ name: 'Bob' });
  });

  test('announce with different attributes', function(t) {
    peers.expect(t, ['/announce', { id: s.id }, genAnnounce({ name: 'Fred' }) ]);
    s.announce({ name: 'Fred' });
  });

  test('disconnect', function(t) {
    peers.expect(t, ['/leave', { id: s.id } ]);
    s.leave();
  });
};

if (typeof document == 'undefined' && (! module.parent)) {
  var peers = require('./helpers/createPeers')(3);
  runTest(peers.shift(), peers);
}
