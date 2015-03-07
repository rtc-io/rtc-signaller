var extend = require('cog/extend');
var test = require('tape');
var createSignaller = require('./helpers/signaller');
var version = require('../package.json').version;
var detect = require('rtc-core/detect');

var runTest = module.exports = function(group) {
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
    t.ok(s = createSignaller(group.messenger), 'created');
    t.ok(s.id, 'have id');
  });

  test('announce', function(t) {
    group.peers.expect(t, ['/announce', s.id ]);
    s.announce();
  });

  test('disconnect', function(t) {
    group.peers.expect(t, ['/leave', s.id ]);
    s.leave();
  });

  test('recreate', function(t) {
    t.plan(2);
    t.ok(s = createSignaller(group.messenger), 'created');
    t.ok(s.id, 'have id');
  });

  test('announce with attributes', function(t) {
    group.peers.expect(t, ['/announce', s.id, genAnnounce({ name: 'Bob' }) ]);
    s.announce({ name: 'Bob' });
  });

  test('announce with different attributes', function(t) {
    group.peers.expect(t, ['/announce', s.id, genAnnounce({ name: 'Fred' }) ]);
    s.announce({ name: 'Fred' });
  });

  test('disconnect', function(t) {
    group.peers.expect(t, ['/leave', s.id ]);
    s.leave();
  });
};

if (! module.parent) {
  runTest(require('./helpers/messenger-group')(3));
}
