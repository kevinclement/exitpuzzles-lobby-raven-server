// var gpio = require('rpi-gpio');
const EventEmitter = require('events');
const SerialPort = require('serialport');
const ReadlineParser = require('@serialport/parser-readline');
const { exec } = require("child_process");

// trigger the raven animation every 5 minutes
const ANIMATION_TIMEOUT = 5 * 60 * 1000

module.exports = class RavenController extends EventEmitter {
    constructor(opts) {
        super();
        this.logger = opts.logger
        this.audio = opts.audio
        // this.caw = false;

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

        // [ ] GPIO for button press
        //   [ ] debounce it
        // [ ] wire up to website
        //   [ ] can manually trigger full or caw
        //   [ ] if manually trigger, reset timer 
          
        // gpio.on('change', (channel, value) => {
        //     if (this.caw != value) {
        //         console.log('state changed ' + this.caw + ' => ' + value);
        //         this.caw = value;
        //     }
        // });

        // gpio.setup(7, gpio.DIR_IN, gpio.EDGE_BOTH);
        // gpio.on('change', (pin, value) => {
        //     this.magnetStateChanged(pin, value);
        // });
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