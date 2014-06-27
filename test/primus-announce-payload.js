var test = require('tape');
var roomId = require('../uuid')();
var jsonparse = require('cog/jsonparse');
var signaller;
var signallingServer = require('./helpers/signalling-server');

test('create a signaller', function(t) {
  t.plan(2);
  t.ok(signaller = require('../')(signallingServer), 'created');
  signaller.once('init', t.pass.bind(t, 'initialized'));
});

test('announce results in a single send to the server', function(t) {
  var spark = signaller._messenger;
  var announceRemaining = 1;

  function handleData(data) {
    var parts = data.split('|').map(jsonparse);

    // if we have an announce message, decrement
    if (parts[0] === '/announce') {
      if (announceRemaining <= 0) {
        t.fail('sending more than one announce message');
      }

      announceRemaining -= 1;
      t.ok(
        parts[1].id === signaller.id &&
        parts[2].id === signaller.id,
        'announce message valid'
      );
    }
  }

  t.plan(3);
  t.equal(typeof spark, 'object', 'primus initialized');
  spark.on('outgoing::data', handleData);

  setTimeout(function() {
    spark.removeListener('outgoing::data', handleData);
    t.equal(announceRemaining, 0, 'announce sent ok');
  }, 1000);

  signaller.announce({ name: 'Fred' });
});
