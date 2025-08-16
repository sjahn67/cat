import { Cat } from "../globals";
import { NODE_ENV, NodeEnvTypes } from "../constants";
import * as GPIO from "pigpio";
import * as GPIO_MOCK from  "pigpio-mock";
import { HwPwms } from "../raspPi4B-hw";
const Gpio: GPIO.Gpio | GPIO_MOCK.Gpio = (NODE_ENV === NodeEnvTypes.NODE_ENV_DEV) ? GPIO_MOCK.Gpio : GPIO.Gpio;
export class ledClass {
  private led: GPIO.Gpio | GPIO_MOCK.Gpio;
  private TargetDutyCycle: number;
  private CurrentDutyCyle: number;
  private Frequence: number;
  private pValue: number;

  constructor(pwmNum: HwPwms, frequence: number) {
    this.led = new Gpio(pwmNum, { mode: Gpio.OUTPUT });
    this.TargetDutyCycle = this.CurrentDutyCyle = 0
    this.pValue = this.CurrentDutyCyle * 100 / Cat.ProgramConfig.led.maxDutyCycle;

    if (frequence < 0) this.Frequence = 0;
    else if (Cat.ProgramConfig.led.maxFrequence < frequence) this.Frequence = Cat.ProgramConfig.led.maxFrequence;
    else this.Frequence = frequence;

    setInterval(() => {
      if (this.TargetDutyCycle == this.CurrentDutyCyle) return;
      let delta = this.TargetDutyCycle - this.CurrentDutyCyle;
      if (Math.abs(delta) > Cat.ProgramConfig.led.dutyCycleStep) {
        delta = (delta > 0) ? Cat.ProgramConfig.led.dutyCycleStep : - Cat.ProgramConfig.led.dutyCycleStep;
      }
      this.CurrentDutyCyle += delta;
      // console.log(`${this.CurrentDutyCyle} -> ${this.TargetDutyCycle} delta:${delta}`);
      this.led.hardwarePwmWrite(this.Frequence, this.CurrentDutyCyle);
    }, Cat.ProgramConfig.led.changeInterval);
  }

  public setPwm(setValue: number) {
    this.pValue = setValue;
    if (this.pValue > 100) {
      this.pValue = 100;
    } else if (this.pValue < 0) {
      this.pValue = 0;
    }
    this.TargetDutyCycle = Math.round(this.pValue / 100 * Cat.ProgramConfig.led.maxDutyCycle);
    // console.log("pValue:", this.pValue, "this.TargetDutyCycle: ", this.TargetDutyCycle);
  }

  public getValue(): number {
    return this.pValue;
  }

  public status() {
    console.log("getPwmRange():", this.led.getPwmRange());
    console.log("getPwmRealRange():", this.led.getPwmRealRange());
    console.log("getPwmFrequency():", this.led.getPwmFrequency());
    console.log("getPwmDutyCycle():", this.led.getPwmDutyCycle());
  }
}