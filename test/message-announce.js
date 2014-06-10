var test = require('tape');
var messenger = require('messenger-memory')({ mock: true });
var signaller;

test('create a signaller', function(t) {
  t.plan(1);
  t.ok(signaller = require('..')(messenger));
});

test('announce with no additional data matches expected', function(t) {
  t.plan(4);
  messenger.once('data', function(data) {
    var parts = data.split('|');

    t.equal(parts.length, 3);
    t.equal(parts[0], '/announce');
    t.doesNotThrow(function() {
      JSON.parse(parts[1]);
    });
    t.doesNotThrow(function() {
      JSON.parse(parts[2]);
    });
  });

  signaller.announce();
});

test('announce payload contained in the json data', function(t) {
  t.plan(5);
  messenger.once('data', function(data) {
    var parts = data.split('|');
    var payload;

    t.equal(parts.length, 3);
    t.equal(parts[0], '/announce');
    t.doesNotThrow(function() {
      JSON.parse(parts[1]);
    });
    t.doesNotThrow(function() {
      payload = JSON.parse(parts[2]);
    });
    t.equal(payload.name, 'Fred');
  });

  signaller.announce({ name: 'Fred' });
});
