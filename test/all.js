var createGroup = require('./helpers/messenger-group');
// test signalling logic
// require('./to')(messenger, peers);

module.exports = function(signalingServer) {
  require('./announce-event-local');
  require('./announce-concurrent');
  require('./announce-customid');
  require('./announce-debounce');
  require('./peer-filter');
  require('./set-id');
  require('./events');
  require('./to');

  // inspect generated messages
  require('./announce-raw')(createGroup(3));
  require('./send-falsey-parts')(createGroup(2));
  require('./message-announce')(createGroup(2));

  // test automatic messenger implementation
  require('./switchboard-auto')(signalingServer);
  require('./switchboard-announce')(signalingServer);
  require('./switchboard-announce-customid')(signalingServer);
  require('./switchboard-manualclose')(signalingServer);
  require('./switchboard-announce-concurrent')(signalingServer);
};
