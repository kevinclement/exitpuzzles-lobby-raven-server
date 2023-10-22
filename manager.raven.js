var gpio = require('rpi-gpio');
const EventEmitter = require('events');

module.exports = class RavenController extends EventEmitter {
    constructor(opts) {
        super();
        this.logger = opts.logger
        this.caw = false;
          
        // TODO: debounce it
        gpio.on('change', (channel, value) => {
            if (this.caw != value) {
                console.log('state changed ' + this.caw + ' => ' + value);
                this.caw = value;
            }
        });

        gpio.setup(7, gpio.DIR_IN, gpio.EDGE_BOTH);
        // gpio.on('change', (pin, value) => {
        //     this.magnetStateChanged(pin, value);
        // });
    }
}