import { SensorData } from "node-dht-sensor";

export interface ISystemStatus {
    led: number,
    co2: boolean,
    cpuTemp: number,
    waterTemp: number,
    fan: boolean,
    isManual: boolean,
    cpuFanSpeed: number,
    airTemp: SensorData
}

// History Data Storage (In-memory)
export interface IHistoryItem {
    timestamp: number;
    led: number;
    cpuTemp: number;
    waterTemp: number;
    airTemp: SensorData;
}