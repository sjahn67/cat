import { Cat } from "./globals";
import { NODE_ENV, NodeEnvTypes } from "./constants";
import { HwPwms, RelayChannels } from "./raspPi4B-hw";

import { ledClass } from "./modules/led";
import { planManager } from "./procedure/plan";
import { relayClass } from "./modules/relay";
import { get_temp } from "./modules/thermo";
import sensor from "ds18b20-raspi-typescript";
import { periodicCheck } from "./etc";
import express from "express";
import cors from "cors";
import path from "path";

const myLed = new ledClass(Cat.ProgramConfig.led.pwmNum, Cat.ProgramConfig.led.curFrequence);
const myCo2 = new relayClass(Cat.ProgramConfig.co2.channelNum);
const CoolingFan = new relayClass(Cat.ProgramConfig.tempControl.channelNum);
const myPlan = new planManager();

// Web Server Setup
const app = express();
const PORT = 3001;

let isManualMode = false;

let systemStatus = {
    led: 0,
    co2: false,
    cpuTemp: 0,
    waterTemp: 0,
    fan: false,
    isManual: false
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/dist"))); // React 빌드 경로 (예시)

app.get("/api/status", (req, res) => {
    res.json(systemStatus);
});

app.post("/api/led", (req, res) => {
    const { value, manual } = req.body;
    if (typeof manual === 'boolean') {
        isManualMode = manual;
    }
    if (isManualMode && typeof value === 'number') {
        myLed.setPwm(value);
        console.log(`...Manual LED Control: ${value}%`);
    }
    // Update status immediately for response
    systemStatus.led = myLed.getValue();
    systemStatus.isManual = isManualMode;
    res.json(systemStatus);
});

app.post("/api/co2", (req, res) => {
    const { value, manual } = req.body;
    if (typeof manual === 'boolean') {
        isManualMode = manual;
    }
    if (isManualMode && typeof value === 'boolean') {
        myCo2.setRelay(value);
        console.log(`...Manual CO2 Control: ${value}`);
    }
    systemStatus.co2 = myCo2.getValue();
    systemStatus.isManual = isManualMode;
    res.json(systemStatus);
});

app.post("/api/fan", (req, res) => {
    const { value, manual } = req.body;
    if (typeof manual === 'boolean') {
        isManualMode = manual;
    }
    if (isManualMode && typeof value === 'boolean') {
        CoolingFan.setRelay(value);
        console.log(`...Manual Fan Control: ${value}`);
    }
    systemStatus.fan = CoolingFan.getValue();
    systemStatus.isManual = isManualMode;
    res.json(systemStatus);
});

app.get("/api/schedule", (req, res) => {
    res.json(myPlan.getSchedule());
});

app.post("/api/schedule", (req, res) => {
    const newData = req.body;
    myPlan.setSchedule(newData);
    res.json({ success: true });
});

// React SPA Fallback (API 요청 이외의 모든 경로는 index.html 반환)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

async function updateSystem() {
    const prevLedValue = myLed.getValue();
    const prevCo2Value = myCo2.getValue();
    const newValue = myPlan.getCurrentValue();

    let curTemp = 0;
    try {
        curTemp = await get_temp();
    } catch (e) {
        console.error("Error reading CPU temp:", e);
    }
    let tempC = 0;
    try {
        tempC = sensor.readSimpleC(5);
    } catch (e) {
        console.error("Error reading Water temp:", e);
    }

    console.log(`...curValue-> led: ${prevLedValue}%, Co2: ${prevCo2Value}`);
    console.log(`...newValue-> led: ${newValue.ledValue}%, Co2: ${newValue.co2}`);
    console.log(`...CPU Temp: ${curTemp} degC`);
    console.log(`...Water Temp: ${tempC} degC`);

    // Update Global Status for Web
    systemStatus = {
        led: myLed.getValue(),
        co2: myCo2.getValue(),
        cpuTemp: curTemp,
        waterTemp: tempC,
        fan: CoolingFan.getValue(),
        isManual: isManualMode
    };

    // Operate LED and CO2 based on the plan
    if (!isManualMode) {
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
}

async function main() {
    myCo2.setRelay(false);
    CoolingFan.setRelay(false);
    try {
        await updateSystem();
    } catch (e) {
        console.error("Initial system update failed:", e);
    }
    periodicCheck(async () => {
        try {
            await updateSystem();
        } catch (e) {
            console.error("Error in periodic check:", e);
        }
    }, 5000);

    app.listen(PORT, () => {
        console.log(`Web Server running on http://localhost:${PORT}`);
    });
}

main();
