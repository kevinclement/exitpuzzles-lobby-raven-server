const Gpio = require('onoff').Gpio;

// gpio readall
// cat /sys/class/gpio/gpio10/value

var wentHigh = false;
var wentHighTime = undefined;
const button = new Gpio(10, 'in', 'both', {debounceTimeout: 0});
button.watch((err, value) => {
    if (err) {
        throw err;
    }
    
    var tn = new Date();
    var timeStr = `${tn.getHours()}:${tn.getMinutes()}:${tn.getSeconds()}:${tn.getMilliseconds()}`
    if (value) {
        wentHigh = true;
        wentHighTime = tn;
        console.log(`${timeStr} button pressed`);
    } else if (wentHigh) {
        var totalTime = tn - wentHighTime;
        console.log(`${timeStr} button fell. time: ${totalTime}`);
        wentHigh = false;
    }
});

