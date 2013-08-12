var EventEmitter = require('events').EventEmitter;

module.exports = function(count) {
  // create the required number of event emitters
  var peers = [];

  function createPeer() {
    var peer = new EventEmitter();

    peer.send = function(data) {
      // emit data on the other peers
      peers.filter(function(other) {
        return other !== peers[ii];
      }).forEach(function(other) {
        other.emit('data', data);
      });
    };

    peer.expect = function(t, result, cb) {
      t._plan = (t._plan || 0) + 1;
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
    peers[ii] = createPeer();
  }

  return {
    shift: function() {
      return peers.shift();
    },
    first: function() {
      return peers[0];
    },

    expect: function(t, result) {
      peers.forEach(function(peer) {
        peer.expect(t, result);
      });
    }
  };
};