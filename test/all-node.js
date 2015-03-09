var test = require('tape');
var server = require('./server')(function(err) {
  test('server started without error', function(t) {
    t.plan(1);
    t.ifError(err);
  });

  require('./all')('http://localhost:' + server.address().port);

  test('close the server', function(t) {
    t.plan(1);
    server.close();
    t.pass('server closed');
  });
});
