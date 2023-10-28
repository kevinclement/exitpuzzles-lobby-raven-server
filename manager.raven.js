// var gpio = require('rpi-gpio');
const EventEmitter = require('events');
const SerialPort = require('serialport');
const ReadlineParser = require('@serialport/parser-readline');

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

        // Read data that is available but keep the stream in "paused mode"
        // port.on('readable', function () {
        //     console.log('Data:', port.read())
        // })
  
        // // Switches the port into "flowing mode"
        // port.on('data', function (data) {
        //     console.log('flData:', data)

        //     const ourBuffer = Buffer.from(data);


        //     console.log("buff read: ", ourBuffer.toString())
        // })
        
  

          
        // TODO: debounce it
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
}