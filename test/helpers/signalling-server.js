var url = typeof window != 'undefined' ? location.origin : 'http://localhost:3000';

module.exports = require('rtc-switchboard-messenger')(url);
