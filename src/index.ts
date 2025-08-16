import { Cat } from "./globals";
import { NODE_ENV, NodeEnvTypes } from "./constants";
import { HwPwms, RelayChannels } from "./raspPi4B-hw";

import { ledClass } from "./modules/led";
import { scheduleJob } from "node-schedule";
import { planManager } from "./procedure/plan";
import { relayClass } from "./modules/relay";
import { get_temp } from "./modules/thermo";
import sensor from "ds18b20-raspi-typescript";

const myLed = new ledClass(Cat.ProgramConfig.led.pwmNum, Cat.ProgramConfig.led.curFrequence);
const myCo2 = new relayClass(Cat.ProgramConfig.co2.channelNum);
const myPlan = new planManager();
let job = null;

async function updateSystem() {
    const prevLedValue = myLed.getValue();
    const prevCo2Value = myCo2.getValue();
    const newValue = myPlan.getCurrentValue();
    const curTemp = await get_temp();
    console.log(`...curValue-> led: ${prevLedValue}, Co2: ${prevCo2Value}`);
    console.log(`...newValue-> led: ${newValue.ledValue}, Co2: ${newValue.co2}`);
    console.log(`...CPU Temp: ${curTemp} C`);
    myLed.setPwm(newValue.ledValue);
    if (Cat.ProgramConfig.co2.enable) {
        myCo2.setRelay(newValue.co2);
    };
    const tempC = sensor.readSimpleC(5);
    console.log(`...Water Temp: ${tempC} degC`);
}

async function main() {
    myCo2.setRelay(false);
    updateSystem();
    job = scheduleJob('0 * * * * *', updateSystem);
}

main();
