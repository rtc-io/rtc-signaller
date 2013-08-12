var http = require('http');
var io = require('socket.io');
var st = require('st');
var server = http.createServer();
var port = process.env.PORT || 3000;

server.listen(port, function(err) {
  if (err) {
    return console.error(err);
  }

  console.log('server running at: http://localhost:' + port + '/');
});