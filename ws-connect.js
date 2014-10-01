var WebSocket = require('ws');
var reHttpSignalhost = /^http(.*)$/;
var reTrailingSlash = /\/$/;
var pingers = [];
var PINGHEADER = 'primus::ping::';
var PONGHEADER = 'primus::pong::';

function connect(signalhost) {
  var socket;

  // if we have a http/https signalhost then do some replacement magic to push across
  // to ws implementation (also add the /primus endpoint)
  if (reHttpSignalhost.test(signalhost)) {
    signalhost = signalhost
      .replace(reHttpSignalhost, 'ws$1')
      .replace(reTrailingSlash, '') + '/primus';
  }

  socket = new WebSocket(signalhost);

  socket.on('message', function(data) {
    if (data.slice(0, PONGHEADER.length) === PONGHEADER) {
      queuePing(socket);
    }
  });

  queuePing(socket);
  return socket;
}

function queuePing(socket) {
  pingers.push(socket);
}

setInterval(function() {
  pingers.splice(0).forEach(function(socket) {
    if (socket.readyState === 1) {
      socket.send(PINGHEADER + Date.now(), function(err) {
        if (err) {
          console.log('could not send ping: ', err);
        }
      });
    }
  });
}, 10e3);

module.exports = function(signalhost, opts, callback) {
  var ws = connect(signalhost);

  ws.once('open', function() {
    // close the test socket
    ws.close();

    callback(null, {
      connect: connect
    });
  });
};
