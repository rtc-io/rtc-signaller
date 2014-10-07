var WebSocket = require('ws');
var reHttpSignalhost = /^http(.*)$/;
var reTrailingSlash = /\/$/;
var pingers = [];
var pingTimer;
var DEFAULT_PATHS = ['/primus', '/'];

function ping() {
  var messages = [
    'primus::ping::' + Date.now(),
    '/ping|' + Date.now()
  ];

  pingers.splice(0).forEach(function(socket) {

    function pingSent(err) {
      if (err) {
        return console.log('could not send ping: ', err);
      }

      queuePing(socket);
    }

    if (socket.readyState === 1) {
      socket.send(messages[0], function(err) {
        if (err) {
          return pingSent(err);
        }

        socket.send(messages[1], pingSent);
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
  var urls;
  var timeout = (opts || {}).connectionTimeout || 2500;

  function checkNext() {
    var url = urls.shift();
    var socket = url && new WebSocket(url);
    var timeoutTimer;

    if (socket) {
      socket.addEventListener('open', function() {
        queuePing(socket);
        clearTimeout(timeoutTimer);

        // watch for socket closes and terminate the ping if appropriate
        socket.addEventListener('close', function() {
          var idx = pingers.indexOf(socket);
          if (idx >= 0) {
            pingers.splice(idx, 1);
            if (pingers.length === 0) {
              clearTimeout(pingTimer);
            }
          }
        });

        callback(null, {
          connect: function() {
            socket.connected = true;

            return socket;
          }
        });
      });

      timeoutTimer = setTimeout(function() {
        socket.close();
        checkNext();
      }, timeout);
    }
  }

  // if we have a protocol match url (//) then add the current location domain
  if (signalhost.slice(0, 2) == '//' && typeof location != 'undefined') {
    signalhost = location.protocol + signalhost;
  }

  // if we have a http/https signalhost then do some replacement magic to push across
  // to ws implementation (also add the /primus endpoint)
  if (reHttpSignalhost.test(signalhost)) {
    signalhost = signalhost
      .replace(reHttpSignalhost, 'ws$1')
      .replace(reTrailingSlash, '');
  }

  // initialise the test urls
  urls = ((opts || {}).paths || DEFAULT_PATHS).map(function(pathname) {
    return signalhost + pathname;
  });

  checkNext();
};
