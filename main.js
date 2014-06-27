var extend = require('cog/extend');

module.exports = function(messenger, opts) {
  return require('./index.js')(messenger, extend({
    connect: require('./ws-connect')
  }, opts));
};
