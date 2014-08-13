var WebSocket = require('ws');
var reHttpSignalhost = /^http(.*)$/;
var reTrailingSlash = /\/$/;

function connect(signalhost) {
  // if we have a http/https signalhost then do some replacement magic to push across
  // to ws implementation (also add the /primus endpoint)
  if (reHttpSignalhost.test(signalhost)) {
    signalhost = signalhost
      .replace(reHttpSignalhost, 'ws$1')
      .replace(reTrailingSlash, '') + '/primus';
  }

  return new WebSocket(signalhost);
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
