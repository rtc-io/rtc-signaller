var test = require('tape');
var server = require('./server')();

server.listen(0, function(err) {
  if (err) {
    console.error('could not start server: ', err);
    return process.exit(1);
  }

  require('./all')('http://localhost:' + server.address().port);

  test('close the server', function(t) {
    t.plan(1);
    server.close();
    t.pass('server closed');
  });
});
