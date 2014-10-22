/* jshint node: true */
'use strict';

/**
  ### signaller message handlers

**/

module.exports = function(signaller, opts) {
  return {
    announce: require('./announce')(signaller, opts)
  };
};
