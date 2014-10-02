var WebSocket = require('ws');
var reHttpSignalhost = /^http(.*)$/;
var reTrailingSlash = /\/$/;

module.exports = function(signalhost, opts, callback) {
  var urls;
  var timeout = (opts || {}).connectionTimeout || 2500;

  function checkNext() {
    var url = urls.shift();
    var socket = url && new WebSocket(url);
    var timeoutTimer;

    if (socket) {
      socket.addEventListener('open', function() {
        clearTimeout(timeoutTimer);

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
  urls = [ signalhost + '/primus', signalhost ];
  checkNext();
};
