var EventEmitter = require('events').EventEmitter;
var jsonparse = require('cog/jsonparse');

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

    peer.expect = function(t, comparisonParts, cb) {
      t.plan((t._plan || 0) + comparisonParts.length + 1);
      
      peer.once('data', function(data) {
        var parts = data.split('|').map(jsonparse);

        t.pass('got data response');

        // check the comparison against the actual parts
        comparisonParts.forEach(function(ref, idx) {
          t.deepEqual(parts[idx], ref, 'part matched');
        });
      });
    };

    peer.connected = true;

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