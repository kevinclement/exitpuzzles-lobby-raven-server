var gpio = require('rpi-gpio');
const EventEmitter = require('events');
const SerialPort = require('serialport');
const ReadlineParser = require('@serialport/parser-readline');
const { exec } = require("child_process");

// trigger the raven animation every 5 minutes
const ANIMATION_TIMEOUT = 5 * 60 * 1000

// length of time that needs to elapse before you can press the button again
const TRIPLE_ANIMATE_WAIT_TIME = 10 * 1000

module.exports = class RavenController extends EventEmitter {
    constructor(opts) {
        super();
        this.logger = opts.logger
        this.audio = opts.audio
        this.lastBtnTrigger = 0;

        const port = new SerialPort('/dev/ttyACM1', { baudRate:9600 })

        const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))
        parser.on('data', (chunk) => {
            let fileToPlay =
                chunk == "caw1"
                    ? 'crow2.wav' : 
                chunk == "caw2"
                    ? 'crow1.wav'                    
                    : 'crow1.wav';

            console.log("Caw detected.  Playing audio '" + fileToPlay +"'")
            this.audio.play(fileToPlay);
        })

        setInterval(this.triggerFullRavenAnimation, ANIMATION_TIMEOUT);

        // [ ] wire up to website
        //   [ ] manually trigger full
        //     [ ] if manually trigger, reset timer 
        //   [ ] manually trigger caw
        //   [ ] enable/disable timer
        //     [ ] expose time between runs 
        // [ ] add auto-start
        // [ ] once device is installed, need to change router config and static assign to allow ssh
        // [ ] print pi case 
        
        gpio.setup(11, gpio.DIR_IN, gpio.EDGE_BOTH);
        gpio.on('change', (pin, value) => {
            
            if (!value) return;

            // if there was a previous press, make sure enough time has elapsed to trigger a new one
            if (this.lastBtnTrigger != 0 && Date.now() - this.lastBtnTrigger < TRIPLE_ANIMATE_WAIT_TIME) {
                console.log("Triple raven button pressed. IGNORING DUE TO ELAPSED TIME.");
                return;
            }
                
            console.log("Triple raven button pressed.");
            this.lastBtnTrigger = Date.now();
            this.triggerTripleCawAnimation();
        });
    }

    triggerFullRavenAnimation() {
        console.log("Triggering Full Raven Animation...")
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
        console.log("Triggering Triple Caw Animation...")
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
}