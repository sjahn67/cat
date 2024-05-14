// import { Gpio as GpioPi } from "pigpio";
// import { Gpio as GpioMock } from "pigpio-mock";
// const Gpio: GpioPi = (process.env.NODE_ENV !== "production") ? GpioMock : GpioPi;

const Gpio = (process.env.NODE_ENV !== "production") ? require("pigpio-mock").Gpio : require("pigpio").Gpio;

const CHANGE_INTERVAL = 10; // msects

const MAX_FREQUENCE = 125000000;
const MAX_DUTYCYCLE = 1000000;
const DUTY_CYCLE_STEP = 1000;

export class ledClass {
  private led;
  private TargetDutyCycle: number;
  private CurrentDutyCyle: number;
  private Frequence: number;

  constructor(gpioNumber: number, frequence: number) {
    this.led = new Gpio(gpioNumber, { mode: Gpio.OUTPUT });
    this.TargetDutyCycle = 0;
    this.CurrentDutyCyle = 0;

    if (frequence < 0) this.Frequence = 0;
    else if (MAX_FREQUENCE < frequence) this.Frequence = MAX_FREQUENCE;
    else this.Frequence = frequence;

    setInterval(() => {
      if (this.TargetDutyCycle == this.CurrentDutyCyle) return;
      const delta = (this.TargetDutyCycle > this.CurrentDutyCyle) ? DUTY_CYCLE_STEP : -DUTY_CYCLE_STEP;
      this.CurrentDutyCyle += delta;
      // this.#led.pwmWrite(this.#CurrentDutyCyle);
      // console.log(this.#CurrentDutyCyle);
      this.led.hardwarePwmWrite(this.Frequence, this.CurrentDutyCyle);
    }, CHANGE_INTERVAL);
  }

  public setPwm(setValue: number) {
    let pValue = setValue;
    if (pValue > 100) {
      pValue = 100;
    } else if (pValue < 0) {
      pValue = 0;
    }
    this.TargetDutyCycle = Math.round(pValue / 100 * MAX_DUTYCYCLE);
  }

  public status() {
    console.log("getPwmRange():", this.led.getPwmRange());
    console.log("getPwmRealRange():", this.led.getPwmRealRange());
    console.log("getPwmFrequency():", this.led.getPwmFrequency());
    console.log("getPwmDutyCycle():", this.led.getPwmDutyCycle());
  }
}