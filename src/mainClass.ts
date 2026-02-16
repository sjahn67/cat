import { Cat } from "./globals";
import { IHistoryItem, ISystemStatus } from "./interfaces/interface-main";
import { DB_DIR_PATH } from "./constants";

import { DHTSensor } from "./modules/dht";
import { fanClass } from "./modules/fan";
import { ledClass } from "./modules/led";
import { relayClass } from "./modules/relay";
import SH1107Display from "./modules/sh1107-spi";
import { planManager } from "./procedure/plan";
import sensor from "ds18b20-raspi-typescript";
import { get_temp } from "./modules/thermo";
import { periodicCheck } from "./etc";
import path from "path";
import { promises as fs } from "fs";

export class MainClass {
    private led: ledClass;
    private cpuFan: fanClass;
    private co2: relayClass;
    private coolingFan: relayClass;
    private airTemp: DHTSensor;
    private oled: SH1107Display;
    private oledInitialized: boolean = false;
    private plan: planManager;

    private isManualMode: boolean;
    private systemStatus: ISystemStatus;
    private historyData: IHistoryItem[] = [];

    constructor() {
        const pConfig = Cat.ProgramConfig;
        this.led = new ledClass(pConfig.led.pwmNum, pConfig.led.curFrequence);
        this.cpuFan = new fanClass(pConfig.fan.pwmNum, pConfig.fan.curFrequence);
        this.co2 = new relayClass(pConfig.co2.channelNum);
        this.coolingFan = new relayClass(pConfig.tempControl.channelNum);
        this.airTemp = new DHTSensor(pConfig.airTempSensor.sensorType, pConfig.airTempSensor.gpio);
        this.oled = new SH1107Display();
        this.plan = new planManager();

        this.isManualMode = false;
        this.systemStatus = {
            led: 0,
            co2: false,
            cpuTemp: 0,
            waterTemp: 0,
            fan: false,
            isManual: false,
            cpuFanSpeed: 0,
            airTemp: { temperature: 0, humidity: 0 }
        };

        // Start OLED update loop (1 second interval)
        setInterval(() => this.updateOled(), 1000);
    }

    public async updateSystem() {
        const prevLedValue = this.led.getValue();
        const prevCo2Value = this.co2.getValue();
        const newValue = this.plan.getCurrentValue();
        const curAirTemp = await this.airTemp.readSensorData();

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

        // console.log(`...curValue-> led: ${prevLedValue}%, Co2: ${prevCo2Value}`);
        // console.log(`...newValue-> led: ${newValue.ledValue}%, Co2: ${newValue.co2}`);
        // console.log(`...CPU Temp: ${curTemp} degC`);
        // console.log(`...Water Temp: ${tempC} degC`);

        // Operate LED and CO2 based on the plan
        if (!this.isManualMode) {
            if (prevLedValue !== newValue.ledValue) {
                console.log(`...Set LED PWM to ${newValue.ledValue}`);
                this.led.setPwm(newValue.ledValue);
            }
            if (prevCo2Value !== newValue.co2) {
                console.log(`...Set CO2 Relay to ${newValue.co2 ? "ON" : "OFF"}`);
                this.co2.setRelay(newValue.co2);
            }
            if (Cat.ProgramConfig.tempControl.enable) {
                // console.log(`...Cooling Fan status:${CoolingFan.getValue() ? "ON" : "OFF"}`);
                if (tempC >= Cat.ProgramConfig.tempControl.startTemp && !this.coolingFan.getValue()) {
                    console.log("...Set cooling Fan ON");
                    this.coolingFan.setRelay(true);
                } else if (tempC <= Cat.ProgramConfig.tempControl.endTemp && this.coolingFan.getValue()) {
                    console.log("...Set cooling Fan OFF");
                    this.coolingFan.setRelay(false);
                }
            }
        }

        // CPU Fan Control (Independent of Manual Mode or add to manual if needed)
        // Simple linear control: 45°C -> 0%, 70°C -> 100%
        const cpuStartTemp = Cat.ProgramConfig.cpuFanControl?.startTemp ?? 45;
        const cpuFullTemp = Cat.ProgramConfig.cpuFanControl?.endTemp ?? 70;
        let targetCpuFanSpeed = 0;

        if (curTemp <= cpuStartTemp) targetCpuFanSpeed = 0;
        else if (curTemp >= cpuFullTemp) targetCpuFanSpeed = 100;
        else targetCpuFanSpeed = Math.round(((curTemp - cpuStartTemp) / (cpuFullTemp - cpuStartTemp)) * 100);

        this.cpuFan.setPwm(targetCpuFanSpeed);

        // Update Global Status for Web
        this.systemStatus = {
            led: this.led.getValue(),
            co2: this.co2.getValue(),
            cpuTemp: curTemp,
            waterTemp: tempC,
            fan: this.coolingFan.getValue(),
            isManual: this.isManualMode,
            cpuFanSpeed: this.cpuFan.getValue(),
            airTemp: curAirTemp
        };

        // Save to History
        this.historyData.push({
            timestamp: Date.now(),
            led: this.systemStatus.led,
            cpuTemp: this.systemStatus.cpuTemp,
            waterTemp: this.systemStatus.waterTemp || 0,
            airTemp: this.systemStatus.airTemp
        });

        // Limit history size (approx. 24 hours at 5s interval = ~17280 points)
        if (this.historyData.length > 20000) this.historyData.shift();
        this.appendToHistory(this.historyData[this.historyData.length - 1]).catch(err => console.error("Failed to save history:", err));
    }

    public getHistoryFilename(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return path.join(DB_DIR_PATH, `history_${year}-${month}-${day}.jsonl`);
    }

    public async loadHistory() {
        try {
            await fs.mkdir(DB_DIR_PATH, { recursive: true });

            // Load yesterday and today to ensure continuity across midnight
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const files = [this.getHistoryFilename(yesterday), this.getHistoryFilename(today)];

            for (const file of files) {
                try {
                    const data = await fs.readFile(file, 'utf-8');
                    const lines = data.split('\n');
                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                this.historyData.push(JSON.parse(line));
                            } catch (e) { /* ignore invalid lines */ }
                        }
                    }
                } catch (e: any) {
                    if (e.code !== 'ENOENT') console.error(`Failed to read history file ${file}:`, e);
                }
            }
            if (this.historyData.length > 20000) this.historyData.splice(0, this.historyData.length - 20000);
            console.log(`...Loaded ${this.historyData.length} history items.`);
        } catch (e: any) {
            console.error("Failed to load history:", e);
        }
    }

    protected async appendToHistory(item: IHistoryItem) {
        try {
            const filename = this.getHistoryFilename(new Date(item.timestamp));
            await fs.appendFile(filename, JSON.stringify(item) + '\n');
        } catch (e) {
            console.error("Failed to append history:", e);
        }
    }

    public async cleanupOldHistory() {
        try {
            const files = await fs.readdir(DB_DIR_PATH);
            const now = new Date();
            const retentionDays = 30;

            for (const file of files) {
                if (file.startsWith('history_') && file.endsWith('.jsonl')) {
                    const match = file.match(/history_(\d{4}-\d{2}-\d{2})\.jsonl/);
                    if (match) {
                        const fileDate = new Date(match[1]);
                        const diffTime = now.getTime() - fileDate.getTime();
                        const diffDays = diffTime / (1000 * 3600 * 24);

                        if (diffDays > retentionDays) {
                            await fs.unlink(path.join(DB_DIR_PATH, file));
                            console.log(`...Deleted old history file: ${file}`);
                        }
                    }
                }
            }
        } catch (e: any) {
            if (e.code !== 'ENOENT') console.error("Failed to cleanup old history:", e);
        }
    }

    public scheduleDailyCleanup() {
        const now = new Date();
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const delay = nextMidnight.getTime() - now.getTime();

        console.log(`...Scheduled next history cleanup in ${Math.round(delay / 60000)} minutes`);

        setTimeout(async () => {
            await this.cleanupOldHistory();
            this.scheduleDailyCleanup();
        }, delay);
    }

    public get SystemStatus(): ISystemStatus {
        return this.systemStatus;
    }

    public get HistoryData(): IHistoryItem[] {
        return this.historyData;
    }

    public get ManualMode() {
        return this.isManualMode;
    }

    public set ManualMode(mode: boolean) {
        this.isManualMode = mode;
    }

    public get Led() {
        return this.led;
    }

    public get Co2() {
        return this.co2;
    }

    public get CoolingFan() {
        return this.coolingFan;
    }

    public get Plan() {
        return this.plan;
    }

    private async updateOled() {
        if (!this.oledInitialized) {
            try {
                await this.oled.initialize();
                this.oledInitialized = true;
            } catch (e) {
                console.error("Failed to initialize OLED:", e);
                return;
            }
        }

        this.oled.clear();

        const tempC = this.systemStatus.waterTemp || 0;
        const curAirTemp = this.systemStatus.airTemp;

        // Top Half: Water Temp (y: 0-63)
        this.oled.drawText(10, 5, "WATER TEMP", 1);
        if (this.systemStatus.co2 && new Date().getSeconds() % 2 === 0) {
            this.oled.drawText(108, 5, "CO2", 1);
        }
        this.oled.drawText(8, 20, `${tempC.toFixed(1)}`, 4);
        this.oled.drawText(108, 36, "C", 2);

        // Divider Lines
        this.oled.drawRect(0, 64, 128, 1, true); // Horizontal Divider
        this.oled.drawRect(64, 64, 1, 46, true); // Vertical Divider (Bottom)

        // Bottom Left: Air Temp (x: 0-63, y: 64-127)
        this.oled.drawText(8, 72, "AIR T.", 1);
        this.oled.drawText(8, 88, curAirTemp ? `${curAirTemp.temperature.toFixed(1)}` : "--.-", 2);

        // Bottom Right: Humidity (x: 64-127, y: 64-127)
        this.oled.drawText(72, 72, "HUMID", 1);
        this.oled.drawText(72, 88, curAirTemp ? `${curAirTemp.humidity.toFixed(0)}%` : "--%", 2);

        // Current Time at Bottom
        const now = new Date();
        const hours = now.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        const timeStr = `${ampm} ${String(hours12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        this.oled.drawText(31, 115, timeStr, 1);

        await this.oled.display();
    }
}