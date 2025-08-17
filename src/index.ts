import { Cat } from "./globals";
import { NODE_ENV, NodeEnvTypes } from "./constants";
import { HwPwms, RelayChannels } from "./raspPi4B-hw";

import { ledClass } from "./modules/led";
import { scheduleJob } from "node-schedule";
import { planManager } from "./procedure/plan";
import { relayClass } from "./modules/relay";
import { get_temp } from "./modules/thermo";
import sensor from "ds18b20-raspi-typescript";
import { periodicCheck } from "./etc";

const myLed = new ledClass(Cat.ProgramConfig.led.pwmNum, Cat.ProgramConfig.led.curFrequence);
const myCo2 = new relayClass(Cat.ProgramConfig.co2.channelNum);
const CoolingFan = new relayClass(Cat.ProgramConfig.tempControl.channelNum);
const myPlan = new planManager();
let job = null;

async function updateSystem() {
    const prevLedValue = myLed.getValue();
    const prevCo2Value = myCo2.getValue();
    const newValue = myPlan.getCurrentValue();
    const curTemp = await get_temp();
    const tempC = sensor.readSimpleC(5);
    console.log(`...curValue-> led: ${prevLedValue}, Co2: ${prevCo2Value}`);
    console.log(`...newValue-> led: ${newValue.ledValue}, Co2: ${newValue.co2}`);
    console.log(`...CPU Temp: ${curTemp} C`);
    console.log(`...Water Temp: ${tempC} degC\n`);
    // Operate LED and CO2 based on the plan
    if (prevLedValue !== newValue.ledValue) {
        console.log(`...Set LED PWM to ${newValue.ledValue}`);
        myLed.setPwm(newValue.ledValue);
    }
    if (prevCo2Value !== newValue.co2) {
        console.log(`...Set CO2 Relay to ${newValue.co2 ? "ON" : "OFF"}`);
        myCo2.setRelay(newValue.co2);
    }
    if (Cat.ProgramConfig.tempControl.enable) {
        console.log(`...Cooling Fan status:${CoolingFan.getValue() ? "ON" : "OFF"}`);
        if (tempC >= Cat.ProgramConfig.tempControl.startTemp && !CoolingFan.getValue()) {
            console.log("...Set cooling Fan ON");
            CoolingFan.setRelay(true);
        } else if (tempC <= Cat.ProgramConfig.tempControl.endTemp && CoolingFan.getValue()) {
            console.log("...Set cooling Fan OFF");
            CoolingFan.setRelay(false);
        }
    }
}

async function main() {
    myCo2.setRelay(false);
    CoolingFan.setRelay(false);
    updateSystem();
    // job = scheduleJob('0 * * * * *', updateSystem);
    periodicCheck(async () => {
        try {
            await updateSystem();
        } catch (e) {
            console.error("Error in periodic check:", e);
        }
    }, 5000);

}

main();
