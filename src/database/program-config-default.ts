import { HwPwms, RelayChannels } from "../raspPi4B-hw"
import { IProgramConfig } from "../interfaces/interface-program-config"
import { DHTType } from "../modules/dht"

export const programConfigDef: IProgramConfig = {
  version: 2,
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
  },
  tempControl: {
    channelNum: RelayChannels.CH2,
    startTemp: 27,
    endTemp: 26.5,
    enable: true
  },
  cpuFanControl: {
    startTemp: 45,
    endTemp: 70
  },
  airTempSensor: {
    sensorType: DHTType.DHT22,
    gpio: 22
  },
  systemUpdateInterval: 5000
}