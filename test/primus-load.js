var test = require('tape');
var loader = require('../primus-loader');
var qsa = require('fdom/qsa');
var async = require('async');

test('can load primus', function(t) {
  t.plan(2);
  loader(location.origin, function(err, p) {
    t.ifError(err);
    t.ok(p === Primus, 'primus loaded, p is a valid Primus reference');
  });
});

test('remove the primus script from the page', function(t) {
  t.plan(1);

  // iterate through the scripts and remove any primus scripts
  qsa('script').forEach(function(script) {
    if (/primus\.js$/.test(script.src)) {
      script.parentNode.removeChild(script);
    }
  });

  // unset Primus
  Primus = undefined;
  t.equal(typeof Primus, 'undefined', 'Primus now undefined');
});

test('concurrent loads pass', function(t) {
  var dl = function(cb) {
    setTimeout(function() {
      loader(location.origin, cb);
    }, 0);
  };

  t.plan(7);
  async.parallel([dl, dl, dl, dl, dl], function(err, instances) {
    t.ifError(err);
    t.ok(Array.isArray(instances), 'got instances');

    instances.forEach(function(instance) {
      t.ok(instance === Primus, 'valid Primus instance');
    })
  });
});

test('remove the primus script from the page', function(t) {
  t.plan(1);

  // iterate through the scripts and remove any primus scripts
  qsa('script').forEach(function(script) {
    if (/primus\.js$/.test(script.src)) {
      script.parentNode.removeChild(script);
    }
  });

  // unset Primus
  Primus = undefined;
  t.equal(typeof Primus, 'undefined', 'Primus now undefined');
});

test('can specify an alternative script location for primus', function(t) {
  t.plan(2);
  loader(location.origin, { primusPath: '/primus/primus.js' }, function(err, p) {
    t.ifError(err);
    t.ok(p === Primus, 'primus loaded, p is a valid Primus reference');
  });
});

test('remove the primus script from the page', function(t) {
  t.plan(1);

  // iterate through the scripts and remove any primus scripts
  qsa('script').forEach(function(script) {
    if (/primus\.js$/.test(script.src)) {
      script.parentNode.removeChild(script);
    }
  });

  // unset Primus
  Primus = undefined;
  t.equal(typeof Primus, 'undefined', 'Primus now undefined');
});
