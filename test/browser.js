var extend = require('cog/extend');
var messenger = require('rtc-switchboard-messenger');
var signaller = require('..');

require('./all');

function createSignaller(opts) {
  return signaller(messenger(location.origin, opts));
}

require('rtc-signaller-testrun')(createSignaller);
