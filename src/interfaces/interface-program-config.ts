export interface IProgramConfig {
    version: number,
    name: string,
    led: {
        gpioNumber: number,
        maxFrequence: number,
        curFrequence: number,
        maxDutyCycle: number,
        dutyCycleStep: number,
        changeInterval: number
    },
    co2: {
        gpioNumber: number
    }
}
