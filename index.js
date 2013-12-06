/* jshint node: true */
'use strict';

var debug = require('cog/logger')('rtc-signaller');
var EventEmitter = require('events').EventEmitter;
var uuid = require('uuid');
var extend = require('cog/extend');
var FastMap = require('collections/fast-map');
var vc = require('vectorclock');

/**
  # rtc-signaller

  The `rtc-signaller` module provides a transportless signalling
  mechanism for WebRTC.

  ## Purpose

  The signaller provides set of client-side tools that assist with the
  setting up an `PeerConnection` and helping them communicate. All that is
  required for the signaller to operate is a suitable messenger.

  A messenger is a simple object that implements node
  [EventEmitter](http://nodejs.org/api/events.html) style `on` events for
  `open`, `close`, `message` events, and also a `send` method by which
  data will be send "over-the-wire".

  By using this approach, we can conduct signalling over any number of
  mechanisms:

  - local, in memory message passing
  - via WebSockets and higher level abstractions (such as
    [primus](https://github.com/primus/primus))
  - also over WebRTC data-channels (very meta, and admittedly a little
    complicated).

  ## Getting Started

  To work with the signaller, you first need a messenger of some kind. If you
  have run up a version of the
  [rtc-switchboard](https://github.com/rtc-io/rtc-switchboard) somewhere then
  the following example should work:

  <<< examples/signalling-via-switchboard.js

  While the example above demonstrates communication between two endpoints
  via websockets, it does not go into detail on setting up a WebRTC peer
  connection (as that is significantly more involved).  If you are looking for
  an easy way to do this, I'd recommend checking out
  [rtc-quickconnect](https://github.com/rtc-io/rtc-quickconnect) or
  [rtc-glue](https://github.com/rtc-io/rtc-glue).

  ## Signal Flow Diagrams

  Displayed below are some diagrams how the signalling flow between peers
  behaves.  In each of the diagrams we illustrate three peers (A, B and C)
  participating discovery and coordinating RTCPeerConnection handshakes.

  In each case, only the interaction between the clients is represented not
  how a signalling server
  (such as [rtc-switchboard](https://github.com/rtc-io/rtc-switchboard)) would
  pass on broadcast messages, etc.  This is done for two reasons:

  1. It is out of scope of this documentation.
  2. The `rtc-signaller` has been designed to work without having to rely on
     any intelligence in the server side signalling component.  In the
     instance that a signaller broadcasts all messages to all connected peers
     then `rtc-signaller` should be smart enough to make sure everything works
     as expected.

  ### Peer Discovery / Announcement

  This diagram illustrates the process of how peer `A` announces itself to
  peers `B` and `C`, and in turn they announce themselves.

  ![](https://raw.github.com/rtc-io/rtc-signaller/master/docs/announce.png)

  ### Editing / Updating the Diagrams

  Each of the diagrams has been generated using
  [mscgen](http://www.mcternan.me.uk/mscgen/index.html) and the source for
  these documents can be found in the `docs/` folder of this repository.

  ## Reference

  The `rtc-signaller` module is designed to be used primarily in a functional
  way and when called it creates a new signaller that will enable
  you to communicate with other peers via your messaging network.

  ```js
  // create a signaller from something that knows how to send messages
  var signaller = require('rtc-signaller')(messenger);
  ```

**/
var sig = module.exports = function(messenger, opts) {

  // create the signaller
  var signaller = new EventEmitter();

  // initialise the id
  var id = signaller.id = uuid.v4();

  // initialise the attributes
  var attributes = signaller.attributes = {
    id: id
  };

  // create the peers map
  var peers = signaller.peers = new FastMap();

  // create our locks map
  var locks = signaller.locks = new FastMap();

  // initialise the data event name
  var dataEvent = (opts || {}).dataEvent || 'data';
  var writeMethod = (opts || {}).writeMethod || 'write';
  var closeMethod = (opts || {}).closeMethod || 'close';

  // extract the write and close function references
  var write = messenger[writeMethod];
  var close = messenger[closeMethod];

  // create the processor
  var processor = require('./processor')(signaller);

  // if the messenger doesn't provide a valid write method, then complain
  if (typeof write != 'function') {
    throw new Error('provided messenger does not implement a "' +
      writeMethod + '" write method');
  }

  function prepareArg(arg) {
    if (typeof arg == 'object' && (! (arg instanceof String))) {
      return JSON.stringify(arg);
    }
    else if (typeof arg == 'function') {
      return null;
    }

    return arg;
  }

  /**
    ### signaller#send(data)

    Send data over the messenging interface.
  **/
  var send = signaller.send = function() {
    // iterate over the arguments and stringify as required
    var args = [].slice.call(arguments);
    var dataline = args.map(prepareArg).filter(Boolean).join('|');

    // send the data over the messenger
    return write.call(messenger, dataline);
  };

  /**
    ### signaller#announce(data?)

    The `announce` function of the signaller will pass an `/announce` message
    through the messenger network.  When no additional data is supplied to
    this function then only the id of the signaller is sent to all active
    members of the messenging network.

    As a unique it is generally insufficient information to determine whether
    a peer is a good match for another (for instance,  you might be looking
    for other parties by name or role) it is generally a good idea to provide
    some additional information during this announce call:

    ```js
    signaller.announce({ role: 'translator' });
    ```

    __NOTE:__ In some particular messenger types may attach or infer
    additional data during the announce phase.  For instance, socket.io
    connections are generally organised into rooms which is inferred
    information that limits the messaging scope.
  **/
  signaller.announce = function(data, sender) {
    // update internal attributes
    extend(attributes, data, { id: id });

    // send the attributes over the network
    return (sender || send)('/announce', attributes);
  };

  /**
    ### signaller#leave()

    Leave the messenger mesh
  **/
  signaller.leave = function() {
    // send the leave signal
    send('/leave', { id: id });

    // call the close method
    if (typeof close == 'function') {
      close.call(messenger);
    }
  };

  /**
    ### signaller#lock(targetId, opts?, callback?)

    Attempt to get a temporary exclusive lock on the communication
    channel between the local signaller and the specified target peer id.
  **/
  signaller.lock = function(targetId, opts, callback) {
    var peer = peers.get(targetId);
    var activeLock;
    var lockid = uuid.v4();
    var label;

    function handleLockResult(src, result) {
      var ok = result && result.ok;

      // if the source does not match the target then abort
      if ((! src) || (src.id !== targetId)) {
        return;
      }

      // if the result label is not a match, then abort
      if ((! result) || (result.label !== label)) {
        return;
      }

      // don't listen for any further lock result messages
      signaller.removeListener('lockresult', handleLockResult);

      // if we don't have an error condition, create an active local lock
      if (ok) {
        locks.set(label, activeLock = { id: lockid });
      }
      // otherwise, delete the local provisional lock
      else if (activeLock) {
        locks.delete(label);
      }

      callback(ok ? null : new Error('could not acquire lock'));
    }

    // check for no label being supplied
    if (typeof opts == 'function') {
      callback = opts;
      opts = {};
    }

    // ensure we have a callback
    callback = callback || function() {};

    // if the peer is not known, then we cannot initiate a lock
    if (! peer) {
      return callback(new Error('unknown target id - cannot initiate lock'));
    }

    // create a default label if none provided
    label = (opts || {}).label || (opts || {}).name || 'default';

    // if we have a local lock already in place, then return ok
    activeLock = locks.get(label);
    if (activeLock && (! activeLock.provisional)) {
      return callback();
    }

    // ensure we have locks for the peer
    peer.locks = peer.locks || new FastMap();

    // if a remote lock is in place, error out
    if (peer.locks.get(label)) {
      return callback(new Error('remote lock in place, cannot request lock'));
    }

    // create a provisional lock
    locks.set(label, activeLock = { id: lockid, provisional: true });

    // wait for the lock result
    signaller.on('lockresult', handleLockResult);

    // send the lock message
    signaller.to(targetId).send('/lock', label, lockid);
  };

  /**
    ### signaller#to(targetId)

    The to method returns an encapsulated

  **/
  signaller.to = function(targetId) {
    // create a sender that will prepend messages with /to|targetId|
    var sender = function() {
      // get the peer (yes when send is called to make sure it hasn't left)
      var peer = signaller.peers.get(targetId);
      var args;

      if (! peer) {
        throw new Error('Unknown peer: ' + targetId);
      }

      args = [
        '/to',
        targetId,
        { id: signaller.id, clock: peer.clock }
      ].concat([].slice.call(arguments));

      // increment the peer clock, using the role of the local
      // signaller.  If the peer role is 0, then the signallers role is 1
      // and using xor (^) will generate the correct index
      vc.increment(peer, ['a', 'b'][peer.roleIdx ^ 1]);

      // write on next tick to ensure clock updates are handled correctly
      setTimeout(function() {
        var msg = args.map(prepareArg).filter(Boolean).join('|');
        debug('TX (' + targetId + '): ', msg);

        // include the current clock value in with the payload
        write.call(messenger, msg);
      }, 0);
    };

    return {
      announce: function(data) {
        return signaller.announce(data, sender);
      },

      send: sender,
    }
  };

  /**

    ### signaller#unlock(targetId, opts?)

  **/
  signaller.unlock = function(targetId, opts, callback) {
    var peer = peers.get(targetId);
    var label;

    function handleUnlockResult(src, result) {
      var ok = result && result.ok;

      // if not the correct source then abort
      if ((! src) || (src.id !== targetId)) {
        return;
      }

      // if this is not an unlock result for this label, then abort
      if ((! result) || (result.label !== label)) {
        return;
      }

      // remove the listener
      signaller.removeListener('unlockresult', handleUnlockResult);

      // if ok, remove our local lock
      if (ok) {
        locks.delete(label);
      }

      // trigger the callback
      callback(ok ? null : new Error('could not release lock: ' + label));
    }

    // handle the no opts case
    if (typeof opts == 'function') {
      callback = opts;
      opts = {};
    }

    // ensure we have a callback
    callback = callback || function() {};

    // set a default label value
    label = (opts || {}).label || (opts || {}).name || 'default';

    // if we have the peer and local lock then action the unlock
    if (peer && locks.get(label)) {
      signaller.on('unlockresult', handleUnlockResult);
      signaller.to(targetId).send('/unlock', label, locks.get(label));
    }
    else {
      return callback(new Error('no local lock with label ' + label));
    }
  };

  // handle message data events
  messenger.on(dataEvent, processor);

  return signaller;
};

sig.loadPrimus = require('./primus-loader');