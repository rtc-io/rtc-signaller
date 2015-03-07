var test = require('tape');

var runTest = module.exports = function(group) {
  var signaller;

  test('create a signaller', function(t) {
    t.plan(1);
    t.ok(signaller = require('./helpers/signaller')(group.messenger));
  });

  test('announce with no additional data matches expected', function(t) {
    t.plan(4);
    group.peers[0].once('rawdata', function(data) {
      var parts = data.split('|');

      t.equal(parts.length, 3);
      t.equal(parts[0], '/announce');
      t.equal(parts[1], signaller.id);
      t.doesNotThrow(function() {
        JSON.parse(parts[2]);
      });
    });

    signaller.announce();
  });

  test('announce payload contained in the json data', function(t) {
    t.plan(5);
    group.peers[0].once('rawdata', function(data) {
      var parts = data.split('|');
      var payload;

      t.equal(parts.length, 3);
      t.equal(parts[0], '/announce');
      t.equal(parts[1], signaller.id);
      t.doesNotThrow(function() {
        payload = JSON.parse(parts[2]);
      });
      t.equal(payload.name, 'Fred');
    });

    signaller.announce({ name: 'Fred' });
  });
};

if  (! module.parent) {
  runTest(require('./helpers/messenger-group')(2));
}
