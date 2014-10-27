var messenger = require('messenger-memory')();
var jsonparse = require('cog/jsonparse');
var signaller = require('../../');
var times = require('whisk/times');

module.exports = function(count) {
  var peers;

  if (count < 2) {
    throw new Error('require at least two peers');
  }

  // create the peers
  peers = times(count - 1).map(function() {
    return signaller(messenger)
  });

  // inject an expect helper
  peers.expect = function(t, comparisonParts) {
    t.plan(peers.length * (comparisonParts.length + 1));

    peers.forEach(function(peer) {
      peer.once('rawdata', function(data) {
        var parts = data.split('|').map(jsonparse);

        t.pass('got data response');

        // check the comparison against the actual parts
        comparisonParts.forEach(function(ref, idx) {
          t.deepEqual(parts[idx], ref, 'part matched');
        });
      });
    });
  };

  return {
    messenger: messenger,
    peers: peers
  };
};
