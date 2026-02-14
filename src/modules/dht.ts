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
            // 라이브러리의 promises 모듈을 사용하여 비동기로 읽기
            // console.log(`DHT 센서에서 데이터 읽기 시도 (GPIO 핀: ${this.gpioPin}, 타입: DHT${this.sensorType})...`);
            const res = await dht.promises.read(this.sensorType, this.gpioPin);

            // 소수점 둘째 자리까지 반올림
            const data: SensorData = {
                temperature: parseFloat(res.temperature.toFixed(2)),
                humidity: parseFloat(res.humidity.toFixed(2)),
            };

            // console.log(`------------------------------`);
            // console.log(`[${new Date().toLocaleTimeString()}] 센서 데이터 수신:`);
            // console.log(`🌡️  온도: ${data.temperature}°C`);
            // console.log(`💧 습도: ${data.humidity}%`);
            return data;

        } catch (err) {
            console.error("❌ 센서 데이터를 읽는데 실패했습니다:", err);
            return { temperature: 0, humidity: 0 };
        }
    }
}