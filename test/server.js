var http = require('http');

module.exports = function(callback) {
  var server = http.createServer();
  var switchboard = require('rtc-switchboard')(server, { servelib: true });

  switchboard.on('fake:disconnect', function(msg, spark) {
    spark.end(null, { reconnect: true });
  });

  switchboard.on('fake:leave', function(msg, spark) {
    spark.end();
  });

  server.listen(0, callback);
  return server;
};
