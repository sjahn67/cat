const Gpio = require('pigpio').Gpio;

const CHANGE_INTERVAL = 100; // msec

class ledClass {
  #led;
  #TargetDutyCycle;
  #CurrentDutyCyle;

  constructor() {
    this.#led = new Gpio(26, { mode: Gpio.OUTPUT });
    this.#TargetDutyCycle = 0;
    this.#CurrentDutyCyle = 0;
    setInterval(() => {
      if (this.#TargetDutyCycle == this.#CurrentDutyCyle) return;
      const delta = (this.#TargetDutyCycle > this.#CurrentDutyCyle) ? 1 : -1;
      this.#CurrentDutyCyle += delta;
      this.#led.pwmWrite(this.#CurrentDutyCyle);
    }, CHANGE_INTERVAL);
  }

  setPwm(setValue) {
    let pValue = Number(setValue);
    if (pValue > 100) {
      pValue = 100;
    } else if (pValue < 0) {
      pValue = 0;
    }
    const setValuve = Math.round(pValue / 100 * 255);
    this.#TargetDutyCycle = setValue;

  }
}

module.exports = ledClass;