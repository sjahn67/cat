import { Cat } from "./globals";
import { NODE_ENV, NodeEnvTypes, RelayModes } from "./constants";

import { ledClass } from "./modules/led";
import { scheduleJob } from "node-schedule";
import { planManager } from "./procedure/plan";
import { relayClass } from "./modules/relay";

const myLed = new ledClass(Cat.ProgramConfig.led.gpioNumber, Cat.ProgramConfig.led.curFrequence);
const myCo2 = new relayClass(Cat.ProgramConfig.co2.gpioNumber);
const myPlan = new planManager();
let job = null;

function updateSystem() {
    const prevLedValue = myLed.getValue();
    const prevCo2Value = myCo2.getValue();
    const newValue = myPlan.getCurrentValue();
    console.log(`...curValue-> led: ${prevLedValue}, Co2: ${prevCo2Value}`);
    console.log(`...newValue-> led: ${newValue.ledValue}, Co2: ${newValue.co2}`);
    myLed.setPwm(newValue.ledValue);
    myCo2.setRelay(newValue.co2);
}

async function main() {
    updateSystem();
    job = scheduleJob('0 * * * * *', updateSystem);
}

main();
