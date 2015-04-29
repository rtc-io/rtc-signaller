var signaller = require('..');
var messenger = require('rtc-switchboard-messenger');

function createSignaller(opts) {
  return signaller(messenger(location.origin), opts);
}

require('./all')(location.origin);
// require('rtc-signaller-testrun')(createSignaller);
