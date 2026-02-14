import * as dht from 'node-dht-sensor';

// define DHT sensor types
export enum DHTType {
    DHT11 = 11,
    DHT22 = 22
};

export interface SensorData {
    temperature: number;
    humidity: number;
}

export class DHTSensor {
    private sensorType: DHTType;
    private gpioPin: number;

    constructor(sensorType: DHTType, gpioPin: number) {
        this.sensorType = sensorType;
        this.gpioPin = gpioPin;
    }

    public async readSensorData(): Promise<SensorData | null> {
        try {
            // Read asynchronously using the library's promises module
            // console.log(`Attempting to read data from DHT sensor (GPIO Pin: ${this.gpioPin}, Type: DHT${this.sensorType})...`);
            const res = await dht.promises.read(this.sensorType, this.gpioPin);

            // Round to two decimal places
            const data: SensorData = {
                temperature: parseFloat(res.temperature.toFixed(2)),
                humidity: parseFloat(res.humidity.toFixed(2)),
            };

            // console.log(`------------------------------`);
            // console.log(`[${new Date().toLocaleTimeString()}] Sensor data received:`);
            // console.log(`🌡️  Temperature: ${data.temperature}°C`);
            // console.log(`💧 Humidity: ${data.humidity}%`);
            return data;

        } catch (err) {
            console.error("❌ Error reading sensor data:", err);
            return null;
        }
    }
}