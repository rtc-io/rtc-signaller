var url = typeof window != 'undefined' ? location.origin : 'http://localhost:3000';
var package = require('../../package.json');
var semver = require('semver');

// if we hare using a switchboard version <= 2 then append /primus
if (semver.satisfies('2.0.0', package.devDependencies['rtc-switchboard'])) {
  url += '/primus';
}

module.exports = require('messenger-ws')(url);
