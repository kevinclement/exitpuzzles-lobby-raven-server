let fb = new (require('./firebase'))
let logger = new (require('./logging'))
let audio = new (require('./audio'))({ logger: logger })
let raven = new (require('./manager.raven'))({ logger: logger, fb: fb, audio: audio })

let managers = [];
managers.push(raven);

logger.log('raven: Started ExitPuzzles Raven server.');

// track firebase connect and disconnects and log them so we can see how often it happens
let _connecting = true;
fb.db.ref('.info/connected').on('value', function(connectedSnap) {
  if (connectedSnap.val() === true) {
    logger.log('raven: firebase connected.');
  } else {
    // dont print an error while its still connecting on first start
    if (_connecting) {
      _connecting = false;
    } else {
      logger.log('raven: firebase dropped connection!');
    }
  }
});

// listen for control operations in the db, filter only ops not completed
fb.db.ref('lobby/operations').orderByChild('completed').equalTo(null).on("child_added", function(snapshot) {
    logger.log('raven: received op ' + snapshot.val().command);

    managers.forEach((m) => {
        m.handle(snapshot);
    });
 });

// update started time and set a ping timer
fb.db.ref('lobby/status/raven').update({
    started: (new Date()).toLocaleString(),
    ping: (new Date()).toLocaleString()
})

// heartbeat timer
setInterval(()  => {
    fb.db.ref('lobby/status/raven').update({
      ping: (new Date()).toLocaleString()
    })
}, 30000)
