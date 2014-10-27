module.exports = require('messenger-ws')(typeof window != 'undefined' ? location.origin : 'http://localhost:3000');
