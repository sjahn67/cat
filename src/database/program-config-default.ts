import { HwPwms, RelayChannels } from "../raspPi4B-hw"
import { IProgramConfig } from "../interfaces/interface-program-config"

export const programConfigDef: IProgramConfig = {
  version: 1,
  name: "Seongjin's Cat",
  led: {
    pwmNum: HwPwms.PWM0_2,
    maxFrequence: 125000000,
    curFrequence: 1000,
    maxDutyCycle: 1000000,
    dutyCycleStep: 1000,
    changeInterval: 10
  },
  co2: {
    channelNum: RelayChannels.CH1,
    enable: true,
  },
  fan: {
    pwmNum: HwPwms.PWM1,
    maxFrequence: 125000000,
    curFrequence: 1000,
    maxDutyCycle: 1000000,
    dutyCycleStep: 1000,
    changeInterval: 10
  }

}