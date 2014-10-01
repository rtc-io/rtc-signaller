var WebSocket = require('ws');
var reHttpSignalhost = /^http(.*)$/;
var reTrailingSlash = /\/$/;
var pingers = [];
var PINGHEADER = 'primus::ping::';
var PONGHEADER = 'primus::pong::';
var pingTimer;

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

  socket.on('close', function() {
    var idx = pingers.indexOf(socket);
    if (idx >= 0) {
      pingers.splice(idx, 1);
      if (pingers.length === 0) {
        clearTimeout(pingTimer);
      }
    }
  });

  queuePing(socket);
  return socket;
}

function ping() {
  pingers.splice(0).forEach(function(socket) {
    if (socket.readyState === 1) {
      socket.send(PINGHEADER + Date.now(), function(err) {
        if (err) {
          console.log('could not send ping: ', err);
        }
      });
    }
  });
}

function queuePing(socket) {
  if (pingers.length === 0) {
    clearTimeout(pingTimer);
    pingTimer = setTimeout(ping, 10e3);
  }

  pingers.push(socket);
}

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
