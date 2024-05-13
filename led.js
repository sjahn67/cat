// const Gpio = process.env.NODE_ENV !== "production" ? require("pigpio-mock").Gpio : require("pigpio").Gpio;
const Gpio = require("pigpio").Gpio;
const CHANGE_INTERVAL = 10; // msec

const  MAX_FREQUENCE = 125000000;
const  CUR_FREQUENCE = 120000;
const  MAX_DUTYCYCLE = 1000000;

class ledClass {
  #led;
  #TargetDutyCycle;
  #CurrentDutyCyle;

  constructor() {
    this.#led = new Gpio(12, { mode: Gpio.OUTPUT });
    this.#TargetDutyCycle = 0;
    this.#CurrentDutyCyle = 0;
    setInterval(() => {
      if (this.#TargetDutyCycle == this.#CurrentDutyCyle) return;
      const delta = (this.#TargetDutyCycle > this.#CurrentDutyCyle) ? 100 : -100;
      this.#CurrentDutyCyle += delta;
      // this.#led.pwmWrite(this.#CurrentDutyCyle);
      this.#led.hardwarePwmWrite(CUR_FREQUENCE, this.#CurrentDutyCyle);
    }, CHANGE_INTERVAL);
  }

  setPwm(setValue) {
    let pValue = Number(setValue);
    if (pValue > 100) {
      pValue = 100;
    } else if (pValue < 0) {
      pValue = 0;
    }
    this.#TargetDutyCycle = Math.round(pValue / 100 * MAX_DUTYCYCLE);
  }
}

module.exports = ledClass;