import { HwPwms, RelayChannels } from "../raspPi4B-hw";

export interface IHwPwmConfig {
    pwmNum: HwPwms,
    maxFrequence: number,
    curFrequence: number,
    maxDutyCycle: number,
    dutyCycleStep: number,
    changeInterval: number
}

export interface IProgramConfig {
    version: number,
    name: string,
    led: IHwPwmConfig,
    co2: {
        channelNum: RelayChannels,
        enable: boolean;
    },
    fan: IHwPwmConfig
}
