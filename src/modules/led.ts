import { Cat } from "../globals";
import { NODE_ENV, NodeEnvTypes } from "../constants";
const Gpio = (NODE_ENV === NodeEnvTypes.NODE_ENV_DEV) ? require("pigpio-mock").Gpio : require("pigpio").Gpio;

export class ledClass {
  private led;
  private TargetDutyCycle: number;
  private CurrentDutyCyle: number;
  private Frequence: number;
  private pValue: number;

  constructor(gpioNumber: number, frequence: number) {
    this.led = new Gpio(gpioNumber, { mode: Gpio.OUTPUT });
    this.TargetDutyCycle = 0;
    this.CurrentDutyCyle = 0;
    this.pValue = 0;

    if (frequence < 0) this.Frequence = 0;
    else if (Cat.ProgramConfig.led.maxFrequence < frequence) this.Frequence = Cat.ProgramConfig.led.maxFrequence;
    else this.Frequence = frequence;

    setInterval(() => {
      if (this.TargetDutyCycle == this.CurrentDutyCyle) return;
      const delta = (this.TargetDutyCycle > this.CurrentDutyCyle) ? Cat.ProgramConfig.led.dutyCycleStep : -Cat.ProgramConfig.led.dutyCycleStep;
      this.CurrentDutyCyle += delta;
      // this.#led.pwmWrite(this.#CurrentDutyCyle);
      // console.log(this.#CurrentDutyCyle);
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