var test = require('tape');
var messenger = require('messenger-memory');
var signaller = require('./helpers/signaller');

test('a new signaller without an id specified will initialize an id', function(t) {
  t.plan(1);
  t.ok(signaller(messenger()).id, 'new signaller has an id');
});

test('a new signaller with an ide specified will use that id', function(t) {
  var id = require('cuid')();
  var sig;

  t.plan(1);
  t.equal(signaller(messenger(), { id: id }).id, id, 'got id match');
});
