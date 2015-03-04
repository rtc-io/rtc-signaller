var http = require('http');

var start = module.exports = function(callback) {
  var server;
  var port = process.env.ZUUL_PORT || process.env.PORT;
  var switchboard;

  server = http.createServer();
  switchboard = require('rtc-switchboard')(server, { servelib: true });

  switchboard.on('fake:disconnect', function(msg, spark) {
    spark.end(null, { reconnect: true });
  });

  switchboard.on('fake:leave', function(msg, spark) {
    spark.end();
  });

  server.listen(parseInt(port, 10) || 3000, function(err) {
    callback(err, server);
  });
};

if (! module.parent) {
  start(function(err) {
    if (err) {
      console.error('could not start testing server: ', err);
    }
  });
}
