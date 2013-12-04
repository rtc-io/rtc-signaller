var EventEmitter = require('events').EventEmitter;

module.exports = function(count) {
  // create the required number of event emitters
  var allPeers = [];
  var testPeers = [];

  function createPeer() {
    var peer = new EventEmitter();

    peer.write = function(data) {
      // emit data on the other peers
      allPeers.filter(function(other) {
        return other !== peer;
      }).forEach(function(other) {
        // send the data at a random interval
        setTimeout(function() {
          other.emit('data', data);
        }, (Math.random() * 100) | 0);
      });
    };

    peer.expect = function(t, result, cb) {
      peer.once('data', function(data) {
        if (typeof result == 'string' || (result instanceof String)) {
          t.equal(data, result);
        }
        else {
          var parts = data.split('|');
          var data = JSON.parse(parts[1]);
          var matches = true;

          data.type = parts[0].slice(1);

          // iterate through the expected result and match 
          Object.keys(result).forEach(function(key) {
            matches = matches && data[key] === result[key];
          });

          t.ok(matches, 'all keys matched');
        }

        if (typeof cb == 'function') {
          cb(data);
        }
      });
    };

    return peer;
  }

  for (var ii = 0; ii < count; ii++) {
    allPeers[ii] = testPeers[ii] = createPeer();
  }

  var result = {
    shift: testPeers.shift.bind(testPeers),
    map: testPeers.map.bind(testPeers),

    first: function() {
      return testPeers[0];
    },

    expect: function(t, result) {
      testPeers.forEach(function(peer) {
        peer.expect(t, result);
      });
    }
  };

  Object.defineProperty(result, 'length', {
    get: function() {
      return testPeers.length;
    }
  });

  return result;
};