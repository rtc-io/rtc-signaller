/* jshint node: true */
'use strict';

/**
  ### signaller message handlers

**/

module.exports = function(signaller) {
  return {
    announce: require('./announce')(signaller),
    leave: require('./leave')(signaller),
    lock: require('./lock')(signaller),
    unlock: require('./unlock')(signaller)
  };
};