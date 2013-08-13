(function(e){if("function"==typeof bootstrap)bootstrap("signaller",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeSignaller=e}else"undefined"!=typeof window?window.signaller=e():global.signaller=e()})(function(){var define,ses,bootstrap,module,exports;
return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
  ### announce

  ```
  /announce|{}
  ```

  When an announce message is received by the socket scope, the attached
  object data is decoded and the scope emits an `announce` message.

**/
module.exports = function(scope) {
  return function(args) {
    try {
      scope.emit('announce', JSON.parse(args[0]));
    }
    catch (e) {
    }
  };
};
},{}],2:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
  ## signaller message handlers

**/

module.exports = function(scope) {
  return {
    announce: require('./announce')(scope),
    request: require('./request')(scope)
  };
};
},{"./announce":1,"./request":3}],3:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
  ### request

  ```
  /request|{"key":"value","__srcid": "", "__reqid": ""}
  ```

  A request is basically a "search for a friend" message.  This is where one
  peer in the mesh is searching for another peer based on particular criteria.
  In general, a request message is delivered to all peers within the mesh 
  and then those peers that are not in a blocked state will respond.

**/
module.exports = function(scope) {
  var attributes = scope.attributes;

  function ackRequest(data) {
    // look for request listeners
    var listeners = scope.listeners('request');

    // TODO: trigger listeners, wait for completion
    if (listeners && listeners.length > 0) {
    }

    // send the ack request
    scope.send(
      '/to', data.__srcid, 
      '/ackreq', data.__reqid, scope.id
    );
  }

  return function(data) {
    var match = true;
    var testKeys;

    try {
      // convert to JSON
      data = JSON.parse(data);
    }
    catch (e) {
      return false;
    }

    // get the testkeys
    testKeys = Object.keys(data).filter(function(key) {
      return key.charAt(0) !== '_';
    });

    // iterate through the test keys and look for a match
    match = testKeys.reduce(function(memo, key) {
      // check for a match
      return memo && attributes[key] === data[key];
    }, match);

    // if we have a match, then acknowledge the request
    if (match) {
      // if there are active blocks, return
      if (scope.blocks.length) {
        return scope.on('unblock', function() {
          ackRequest(data);
        });
      }

      return ackRequest(data);
    }

    return false;
  };
};
},{}],4:[function(require,module,exports){
/* jshint node: true */
'use strict';

var EventEmitter = require('events').EventEmitter;
var uuid = require('uuid');
var extend = require('cog/extend');

/**
  # rtc-signaller

  The `rtc-signaller` module provides a transportless signalling
  mechanism for WebRTC.  This is the second implementation of a signaller
  in the rtc.io suite, where we have moving away from a central
  processing model to a pure P2P signalling implementation.

  [
  ![Build Status]
  (https://travis-ci.org/rtc-io/rtc-signaller.png?branch=master)
  ](https://travis-ci.org/rtc-io/rtc-signaller)

  [
  ![experimental]
  (http://hughsk.github.io/stability-badges/dist/experimental.svg)
  ](http://github.com/hughsk/stability-badges)

  All that is required for the signaller to operate is a suitable messenger.

  A messenger is a simple object that implements node
  [EventEmitter](http://nodejs.org/api/events.html) style `on` events for
  `open`, `close`, `message` events, and also a `send` method by which 
  data will be send "over-the-wire".

  By using this approach, we can conduct signalling over any number of 
  mechanisms:

  - local, in memory message passing
  - via WebSockets and higher level abstractions (such as 
    [socket.io](http://socket.io) and friends)
  - also over WebRTC data-channels (very meta, and admittedly a little
    complicated).

  ## Getting Started

  To be completed.

  ## Reference

  The `rtc-signaller` module is designed to be used primarily in a functional
  way and when called it creates a new signalling scope that will enable
  you to communicate with other peers via your messaging network.

  ```js
  var signaller = require('rtc-signaller');
  var scope = signaller(messenger);
  ```

**/
module.exports = function(messenger, opts) {

  // create the signalling scope
  var scope = new EventEmitter();

  // initialise the id
  var id = scope.id = uuid.v4();

  // initialise the attributes
  var attributes = scope.attributes = {
    id: id
  };

  // initialise the data event name
  var dataEvent = (opts || {}).dataEvent || 'data';

  scope.blocks = [];
  scope.matchers = [];

  function createChannel(targetId) {
    return {
      send: function() {
        send.apply(null, ['/to', targetId].concat([].slice.call(arguments)));
      }
    };
  }

  function once(prefix, handler) {
    scope.matchers.push({
      prefix: prefix,
      handler: handler
    });
  }

  /**
    ### scope.send(data)

    Send data over the messenging interface.
  **/
  var send = scope.send = function() {
    // iterate over the arguments and stringify as required
    var params = [].slice.call(arguments).map(function(data) {
      if (typeof data == 'object' && (! (data instanceof String))) {
        return JSON.stringify(data);
      }
      else if (typeof data == 'function') {
        return null;
      }

      return data;
    }).filter(Boolean);

    // send the data over the messenger
    return messenger.send(params.join('|'));
  };

  /**
    ### scope.announce(data?)

    The `announce` function of the scope will a scope message through the
    messenger network.  When no additional data is supplied to this function
    then only the id of the scope is sent to all active members of the
    messenging network.

    As a unique it is generally insufficient information to determine whether
    a peer is a good match for another (for instance,  you might be looking
    for other parties by name or role) it is generally a good idea to provide
    some additional information during this announce call:

    ```js
    scope.announce({ role: 'translator' });
    ```

    __NOTE:__ In some particular messenger types may attach or infer
    additional data during the announce phase.  For instance, socket.io
    connections are generally organised into rooms which is inferred
    information that limits the messaging scope.
  **/
  scope.announce = function(data) {
    // update internal attributes
    extend(attributes, data, { id: id });

    // send the attributes over the network
    return send('/announce', attributes);
  };

  /**
    ### scope.block()

    Prevent the scope from responding to requests until the block
    is cleared with a clearBlock call.
  **/
  scope.block = function() {
    // create a block id
    var id = uuid.v4();

    // add the active block
    scope.blocks.push(id);

    // return the id
    return id;
  };

  /**
    ### scope.clearBlock(id)

    Clear the specified block id
  **/
  scope.clearBlock = function(id) {
    var wasBlocked = scope.blocks.length > 0;

    // remove blocks matching the id
    scope.blocks = scope.blocks.filter(function(blockId) {
      return blockId !== id;
    });

    // if unblocked, trigger the unblock event
    if (wasBlocked && scope.blocks.length === 0) {
      scope.emit('unblock');
    }
  };

  /**
    ### scope.leave()

    Leave the messenger mesh
  **/
  scope.leave = function() {
    return send('/leave', { id: id });
  };

  /**
    ### scope.request(data)

    The `scope.request` call is where one peer goes looking for a target
    peer that satisfies specific search parameters.  This may be a search
    for a peer with a particular id, or something more general such as
    a request for a peer with a particular name or role.

    Once a suitable match has been found from within the messenging network
    the callback will fire and provide a discrete messaging channel to that
    particular peer.

    __NOTE:__ The discreteness of the message needs to be programmed at the
    mesh level if required. Signallers will not attempt to parse a message
    destined for another signaller, but they are visible by default.  This
    can easily be handled however, by filtering `/to` messages.
  **/
  scope.request = function(data, opts, callback) {
    // initialise a request id
    var reqid = uuid.v4();

    // handle 2 arg form
    if (typeof opts == 'function') {
      callback = opts;
      opts = {};
    }

    // TODO: inspect known peers for a match

    // handle request acknowledge
    once('/ackreq|' + reqid, function(data) {
      var targetId = data.split('|')[2];
      
      // trigger the callback with the send function wired
      callback(null, createChannel(targetId));
    });

    // send out a request across the network
    send('/request', extend({}, data, {
      __srcid: id,
      __reqid: reqid
    }));
  };

  // handle message data events
  messenger.on(dataEvent, require('./processor')(scope));

  return scope;
};
},{"./processor":9,"cog/extend":6,"events":5,"uuid":8}],5:[function(require,module,exports){
var process=require("__browserify_process");if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (typeof emitter._events[type] === 'function')
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

},{"__browserify_process":11}],6:[function(require,module,exports){
/* jshint node: true */
'use strict';

/** 
## extend(target, *)

Shallow copy object properties from the supplied source objects (*) into 
the target object, returning the target object once completed:

```js
var extend = require('cog/extend');

extend({ a: 1, b: 2 }, { c: 3 }, { d: 4 }, { b: 5 }));
```

See an example on [requirebin](http://requirebin.com/?gist=6079475).
**/
module.exports = function(target) {
  [].slice.call(arguments, 1).forEach(function(source) {
    if (! source) {
      return;
    }

    for (var prop in source) {
      target[prop] = source[prop];
    }
  });

  return target;
};
},{}],7:[function(require,module,exports){
var global=require("__browserify_global");
var rng;

if (global.crypto && crypto.getRandomValues) {
  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
  // Moderately fast, high quality
  var _rnds8 = new Uint8Array(16);
  rng = function whatwgRNG() {
    crypto.getRandomValues(_rnds8);
    return _rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var  _rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return _rnds;
  };
}

module.exports = rng;


},{"__browserify_global":10}],8:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var _rng = require('./rng');

// Buffer class to use
var BufferClass = typeof(Buffer) == 'function' ? Buffer : Array;

// Maps for number <-> hex string conversion
var _byteToHex = [];
var _hexToByte = {};
for (var i = 0; i < 256; i++) {
  _byteToHex[i] = (i + 0x100).toString(16).substr(1);
  _hexToByte[_byteToHex[i]] = i;
}

// **`parse()` - Parse a UUID into it's component bytes**
function parse(s, buf, offset) {
  var i = (buf && offset) || 0, ii = 0;

  buf = buf || [];
  s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
    if (ii < 16) { // Don't overflow!
      buf[i + ii++] = _hexToByte[oct];
    }
  });

  // Zero out remaining bytes if string was short
  while (ii < 16) {
    buf[i + ii++] = 0;
  }

  return buf;
}

// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
function unparse(buf, offset) {
  var i = offset || 0, bth = _byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = _rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; n++) {
    b[i + n] = node[n];
  }

  return buf ? buf : unparse(b);
}

// **`v4()` - Generate random UUID**

// See https://github.com/broofa/node-uuid for API details
function v4(options, buf, offset) {
  // Deprecated - 'format' argument, as supported in v1.2
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new BufferClass(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || _rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ii++) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || unparse(rnds);
}

// Export public API
var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;
uuid.parse = parse;
uuid.unparse = unparse;
uuid.BufferClass = BufferClass;

module.exports = uuid;

},{"./rng":7}],9:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
  ## signaller process handling

  When a signaller's underling messenger emits a `data` event this is
  delegated to a simple message parser, which applies the following simple
  logic:

  - Is the message a `/to` message. If so, see if the message is for this
    signaller scope (checking the target id - 2nd arg).  If so pass the
    remainder of the message onto the standard processing chain.  If not,
    discard the message.

  - Is the message a command message (prefixed with a forward slash). If so,
    look for an appropriate message handler and pass the message payload on
    to it.

  - Finally, does the message match any patterns that we are listening for?
    If so, then pass the entire message contents onto the registered handler.
**/
module.exports = function(scope) {
  var id = scope.id;
  var handlers = require('./handlers')(scope);

  return function(data) {
    var isMatch = true;
    var parts;
    var handler;

    // process /to messages
    if (data.slice(0, 3) === '/to') {
      isMatch = data.slice(4, id.length + 4) === id;
      if (isMatch) {
        data = data.slice(5 + id.length);
      }
    }

    // if this is not a match, then bail
    if (! isMatch) {
      return;
    }

    // chop the data into parts
    parts = data.split('|');

    // if we have a specific handler for the action, then invoke
    if (parts[0].charAt(0) === '/') {
      handler = handlers[parts[0].slice(1)];

      if (typeof handler == 'function') {
        handler(parts.slice(1));
      }
      else {
        scope.emit.apply(scope, [parts[0].slice(1)].concat(parts.slice(1)));
      }
    }

    // process matchers
    scope.matchers = scope.matchers.filter(function(rule) {
      var exec = data.slice(0, rule.prefix.length) === rule.prefix;

      if (exec && typeof rule.handler == 'function') {
        rule.handler(data);
      }

      // only keep if not executed
      return !exec;
    });
  };
};
},{"./handlers":2}],10:[function(require,module,exports){
return {}
},{}],11:[function(require,module,exports){
return {}
},{}]},{},[4])(4)
});
;