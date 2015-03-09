module.exports = function() {
  var server = require('http').createServer();
  var switchboard = require('rtc-switchboard')(server, { servelib: true });

  switchboard.on('fake:disconnect', function(msg, spark) {
    spark.end(null, { reconnect: true });
  });

  switchboard.on('fake:leave', function(msg, spark) {
    spark.end();
  });

  return server;
};
