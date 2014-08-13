/* jshint node: true */
/* global document, location, Primus: false */
'use strict';

var reTrailingSlash = /\/$/;
var formatter = require('formatter');
var primusUrl = formatter('{{ signalhost }}{{ primusPath }}');

/**
  ### loadPrimus(signalhost, opts?, callback)

  This is a convenience function that is patched into the signaller to assist
  with loading the `primus.js` client library from an `rtc-switchboard`
  signaling server.

**/
module.exports = function(signalhost, opts, callback) {
  var anchor = document.createElement('a');
  var script;
  var scriptSrc;

  // if the signalhost is a function, we are in single arg calling mode
  if (typeof signalhost == 'function') {
    callback = signalhost;
    signalhost = location.origin;
  }

  if (typeof opts == 'function') {
    callback = opts;
    opts = {};
  }

  // initialise the anchor with the signalhost
  anchor.href = signalhost;

  // initialise the script location
  scriptSrc = primusUrl({
    signalhost: signalhost.replace(reTrailingSlash, ''),
    primusPath: (opts || {}).primusPath || '/rtc.io/primus.js'
  });

  // look for the script first
  script = document.querySelector('script[src="' + scriptSrc + '"]');

  // if we found, the script trigger the callback immediately
  if (script && typeof Primus != 'undefined') {
    return callback(null, Primus);
  }
  // otherwise, if the script exists but Primus is not loaded,
  // then wait for the load
  else if (script) {
    script.addEventListener('load', function() {
      callback(null, Primus);
    });

    return;
  }

  // otherwise create the script and load primus
  script = document.createElement('script');
  script.src = scriptSrc;

  script.onerror = callback;
  script.addEventListener('load', function() {
    // if we have a signalhost that is not basepathed at /
    // then tweak the primus prototype
    if (anchor.pathname !== '/') {
      Primus.prototype.pathname = anchor.pathname.replace(reTrailingSlash, '') +
        Primus.prototype.pathname;
    }

    callback(null, Primus);
  });

  document.body.appendChild(script);
};
