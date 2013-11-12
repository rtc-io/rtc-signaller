var test = require('tape');
var loader = require('../primus-loader');

test('can load primus', function(t) {
  t.plan(2);
  loader(location.origin, function(err, p) {
    t.ifError(err);
    t.ok(p === Primus, 'primus loaded, p is a valid Primus reference');
  });
});

test('can load primus, defaulting to location.origin', function(t) {
  t.plan(2);
  loader(function(err, p) {
    t.ifError(err);
    t.ok(p === Primus, 'primus loaded, p is a valid Primus reference');
  });
});