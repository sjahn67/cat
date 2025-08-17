import { Cat } from "../globals";
import { Gpio } from "pigpio";
export class ledClass {
  private fan: Gpio;
  private TargetDutyCycle: number;
  private CurrentDutyCyle: number;
  private Frequence: number;
  private pValue: number;

  constructor(gpioNumber: number, frequence: number) {
    this.fan = new Gpio(gpioNumber, { mode: Gpio.OUTPUT });
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
      this.fan.hardwarePwmWrite(this.Frequence, this.CurrentDutyCyle);
    }, Cat.ProgramConfig.fan.changeInterval);
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
    console.log("getPwmRange():", this.fan.getPwmRange());
    console.log("getPwmRealRange():", this.fan.getPwmRealRange());
    console.log("getPwmFrequency():", this.fan.getPwmFrequency());
    console.log("getPwmDutyCycle():", this.fan.getPwmDutyCycle());
  }
}