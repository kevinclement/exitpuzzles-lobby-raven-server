var gpio = require('rpi-gpio');
const EventEmitter = require('events');
const SerialPort = require('serialport');
const ReadlineParser = require('@serialport/parser-readline');
const { exec } = require("child_process");

// length of time that needs to elapse before you can press the button again
const TRIPLE_ANIMATE_WAIT_TIME = 10 * 1000

module.exports = class RavenController extends EventEmitter {
    constructor(opts) {
        super();
        this.logger = opts.logger
        this.audio = opts.audio
        this.ref = opts.fb.db.ref('lobby/devices/raven')
        this.name = "raven"
        this.logPrefix = 'handler: ' + this.name + ': '
        this.handlers = {};
        this.created = (new Date()).getTime()
        this.lastBtnTrigger = 0;
        this.animationTimer = undefined;

        // setup supported commands
        this.handlers['raven.enable'] = (s,cb) => {
            this.ref.update({
                animationEnabled: true
            })
            cb()
        }

        this.handlers['raven.disable'] = (s,cb) => {
            this.ref.update({
                animationEnabled: false
            })
            cb()
        }

        // Watch DB and update as needed        
        this.ref.on('value', (snapshot) => {
            let raven = snapshot.val()
            if (raven == null) return

            this.handleAnimationTimer(raven.animationEnabled, raven.animationWaitTimeMin);
        })

        const port = new SerialPort('/dev/ttyACM1', { baudRate:9600 })

        const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))
        parser.on('data', (chunk) => {
            let fileToPlay =
                chunk == "caw1"
                    ? 'crow2.wav' : 
                chunk == "caw2"
                    ? 'crow1.wav'                    
                    : 'crow1.wav';

            this.logger.log(this.logPrefix + "caw detected.  playing audio '" + fileToPlay +"'")
            this.audio.play(fileToPlay);
        })

        // [ ] wire up to website
        //   [ ] manually trigger full
        //     [ ] if manually trigger, reset timer 
        //   [ ] manually trigger caw
        //   [ ] enable/disable timer
        //     [ ] expose time between runs 
        // [ ] add auto-start
        // [ ] once device is installed, need to change router config and static assign to allow ssh
        
        gpio.setup(11, gpio.DIR_IN, gpio.EDGE_BOTH);
        gpio.on('change', (pin, value) => {
            
            if (!value) return;

            // if there was a previous press, make sure enough time has elapsed to trigger a new one
            if (this.lastBtnTrigger != 0 && Date.now() - this.lastBtnTrigger < TRIPLE_ANIMATE_WAIT_TIME) {
                this.logger.log(this.logPrefix + "triple raven button pressed. IGNORING DUE TO ELAPSED TIME.")
                return;
            }
                
            this.logger.log(this.logPrefix + "triple raven button pressed.")
            this.lastBtnTrigger = Date.now();
            this.triggerTripleCawAnimation();
        });
    }

    handleAnimationTimer(isEnabled, waitTimeInMin) {
        this.logger.log(this.logPrefix + "updating animation timer, enabled: " + isEnabled + ", waitTimeMin: " + waitTimeInMin)

        // if there is a timer running, lets remove it
        if (this.animationTimer) {
            this.logger.log(this.logPrefix + "running timer found, removing...")
            clearInterval(this.animationTimer);
            this.animationTimer = undefined;
        }

        if (isEnabled) {
            this.logger.log(this.logPrefix + "scheduling timer...")
            this.animationTimer = setInterval(() => { this.triggerFullRavenAnimation() }, waitTimeInMin * 60 * 1000);
        }
    }

    triggerFullRavenAnimation() {
        this.logger.log(this.logPrefix + "triggering full raven animation...")
        exec("UscCmd --sub 6", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
        });
    }

    triggerTripleCawAnimation() {
        this.logger.log(this.logPrefix + "triggering triple caw animation...")
        exec("UscCmd --sub 7", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
        });
    }

    handle(snapshot) {
        // only push operations that can be handled by this manager
        Object.keys(this.handlers).forEach((hp) => {
            if (snapshot.val().command == hp) {
                let op = snapshot.val()

                // if the operation was in the db before we started, clear it out
                if (op.created < this.created) {
                    let now = (new Date()).toString()
                    this.logger.log(this.logPrefix + 'canceling older op \'' + op.command + '\'.')
                    snapshot.ref.update({ 'completed': now, 'canceled': now })
                    return
                }

                this.logger.log(this.logPrefix + 'handling ' + op.command + ' ...')

                // mark it received since all handlers would need to do it
                snapshot.ref.update({ 'received': (new Date()).toString() });

                this.handlers[hp](snapshot, () => {
                    snapshot.ref.update({ 'completed': (new Date()).toString() });
                })
            }
        })
    }
}