"use strict";

const ledClass = require("./led");
const schedule = require('node-schedule');
const plan = require("./plan");
const myLed = new ledClass();
let job = null;

function updateLed() {
    const curValue = plan.getCurrentValue();
    console.log("...curValue:", curValue);
    myLed.setPwm(curValue);
}

async function main() {
    updateLed();
    job = schedule.scheduleJob('0 * * * * *', updateLed);
}



main();
