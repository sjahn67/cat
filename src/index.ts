import { Cat } from "./globals";
import { NODE_ENV, NodeEnvTypes, DB_DIR_PATH } from "./constants";
import { HwPwms, RelayChannels } from "./raspPi4B-hw";

import { ledClass } from "./modules/led";
import { fanClass } from "./modules/fan";
import { planManager } from "./procedure/plan";
import { relayClass } from "./modules/relay";
import { get_temp } from "./modules/thermo";
import sensor from "ds18b20-raspi-typescript";
import { periodicCheck } from "./etc";
import express from "express";
import cors from "cors";
import path from "path";
import { saveProgramConfig } from "./database/file-database";
import { promises as fs } from "fs";
import { DHTSensor, DHTType } from "./modules/dht";
import { MainClass } from "./mainClass";

const mainInst = new MainClass();

// Web Server Setup
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/dist"))); // React 빌드 경로 (예시)

app.get("/api/status", (req, res) => {
    res.json(mainInst.SystemStatus);
});

app.get("/api/history", (req, res) => {
    res.json(mainInst.HistoryData);
});

app.post("/api/led", (req, res) => {
    const { value, manual } = req.body;
    if (typeof manual === 'boolean') {
        mainInst.ManualMode = manual;
    }
    if (mainInst.ManualMode && typeof value === 'number') {
        mainInst.Led.setPwm(value);
        console.log(`...Manual LED Control: ${value}%`);
    }
    // Update status immediately for response
    mainInst.SystemStatus.led = mainInst.Led.getValue();
    mainInst.SystemStatus.isManual = mainInst.ManualMode;
    res.json(mainInst.SystemStatus);
});

app.post("/api/co2", (req, res) => {
    const { value, manual } = req.body;
    if (typeof manual === 'boolean') {
        mainInst.ManualMode = manual;
    }
    if (mainInst.ManualMode && typeof value === 'boolean') {
        mainInst.Co2.setRelay(value);
        console.log(`...Manual CO2 Control: ${value}`);
    }
    mainInst.SystemStatus.co2 = mainInst.Co2.getValue();
    mainInst.SystemStatus.isManual = mainInst.ManualMode;
    res.json(mainInst.SystemStatus);
});

app.post("/api/fan", (req, res) => {
    const { value, manual } = req.body;
    if (typeof manual === 'boolean') {
        mainInst.ManualMode = manual;
    }
    if (mainInst.ManualMode && typeof value === 'boolean') {
        mainInst.CoolingFan.setRelay(value);
        console.log(`...Manual Fan Control: ${value}`);
    }
    mainInst.SystemStatus.fan = mainInst.CoolingFan.getValue();
    mainInst.SystemStatus.isManual = mainInst.ManualMode;
    res.json(mainInst.SystemStatus);
});

app.get("/api/config", (req, res) => {
    res.json(Cat.ProgramConfig);
});

app.post("/api/config/temp", (req, res) => {
    const { startTemp, endTemp, enable } = req.body;
    if (startTemp !== undefined) Cat.ProgramConfig.tempControl.startTemp = Number(startTemp);
    if (endTemp !== undefined) Cat.ProgramConfig.tempControl.endTemp = Number(endTemp);
    if (enable !== undefined) Cat.ProgramConfig.tempControl.enable = Boolean(enable);
    console.log(`...Updated Temp Control: Start=${Cat.ProgramConfig.tempControl.startTemp}, End=${Cat.ProgramConfig.tempControl.endTemp}, Enable=${Cat.ProgramConfig.tempControl.enable}`);
    res.json({ success: true });
});

app.post("/api/config/cpu-fan", (req, res) => {
    const { startTemp, endTemp } = req.body;
    if (!Cat.ProgramConfig.cpuFanControl) Cat.ProgramConfig.cpuFanControl = { startTemp: 45, endTemp: 70 };

    if (startTemp !== undefined) Cat.ProgramConfig.cpuFanControl.startTemp = Number(startTemp);
    if (endTemp !== undefined) Cat.ProgramConfig.cpuFanControl.endTemp = Number(endTemp);
    console.log(`...Updated CPU Fan Control: Start=${Cat.ProgramConfig.cpuFanControl.startTemp}, End=${Cat.ProgramConfig.cpuFanControl.endTemp}`);
    res.json({ success: true });
});

app.post("/api/config/system", (req, res) => {
    const { updateInterval } = req.body;
    if (updateInterval !== undefined) Cat.ProgramConfig.systemUpdateInterval = Number(updateInterval);
    saveProgramConfig(Cat.ProgramConfig);
    console.log(`...Updated System Config: Interval=${Cat.ProgramConfig.systemUpdateInterval}`);
    res.json({ success: true });
});

app.get("/api/schedule", (req, res) => {
    res.json(mainInst.Plan.getSchedule());
});

app.post("/api/schedule", async (req, res) => {
    try {
        const newData = req.body;
        mainInst.Plan.setSchedule(newData);

        // Resume Auto Mode and apply changes immediately
        mainInst.ManualMode = false;
        await mainInst.updateSystem();

        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// React SPA Fallback (API 요청 이외의 모든 경로는 index.html 반환)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

async function main() {
    await mainInst.loadHistory();
    mainInst.scheduleDailyCleanup();
    mainInst.Co2.setRelay(false);
    mainInst.CoolingFan.setRelay(false);
    try {
        await mainInst.updateSystem();
    } catch (e) {
        console.error("Initial system update failed:", e);
    }
    periodicCheck(async () => {
        try {
            await mainInst.updateSystem();
        } catch (e) {
            console.error("Error in periodic check:", e);
        }
    }, () => Cat.ProgramConfig.systemUpdateInterval || 5000);

    app.listen(PORT, () => {
        console.log(`Web Server running on http://localhost:${PORT}`);
    });
}

main();
