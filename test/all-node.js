var test = require('tape');

require('./server')(function(err, server) {
  test('server started without error', function(t) {
    t.plan(1);
    t.ifError(err);
  });

  require('./all');

  if (server) {
    test('close the server', function(t) {
      t.plan(1);
      server.close();
      t.pass('server closed');
    });
  }
});
