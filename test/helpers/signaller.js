var extend = require('cog/extend');
var signaller = require('../../');

module.exports = function(host, opts) {
  return signaller(host, extend({ reconnect: false }, opts));
};
