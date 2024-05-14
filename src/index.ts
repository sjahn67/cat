import { ledClass } from "./led";
import { scheduleJob } from "node-schedule";
import { getCurrentValue } from "./plan";

const CUR_FREQUENCE = 1000;
const PWM_GPIO = 12;

const myLed = new ledClass(PWM_GPIO, CUR_FREQUENCE);
let job = null;

function updateLed() {
    const curValue = getCurrentValue();
    console.log("...curValue:", curValue);
    myLed.setPwm(curValue.ledValue);
    // myLed.status();
}

async function main() {
    updateLed();
    job = scheduleJob('0 * * * * *', updateLed);
}

main();
