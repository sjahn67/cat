import { Cat } from "../globals";
import { NODE_ENV, NodeEnvTypes } from "../constants";
import { RelayChannels, RelayModes } from "../raspPi4B-hw";
import * as GPIO from "pigpio";
import * as GPIO_MOCK from  "pigpio-mock";
const Gpio: GPIO.Gpio | GPIO_MOCK.Gpio = (NODE_ENV === NodeEnvTypes.NODE_ENV_DEV) ? GPIO_MOCK.Gpio : GPIO.Gpio;

export class relayClass {
    private relay: GPIO.Gpio | GPIO_MOCK.Gpio;
    private curValue: number;
    constructor(chanellNum: RelayChannels) {
        this.relay = new Gpio(chanellNum, { mode: Gpio.OUTPUT });
        this.curValue = this.relay.digitalRead();
    }

    public setRelay(value: boolean) {
        let setValue: number = RelayModes.MODE_1;
        if (value) setValue = RelayModes.MODE_0;

        if (this.curValue !== setValue) {
            this.relay.digitalWrite(setValue);
            this.curValue = this.relay.digitalRead();
        }
    }

    public getValue(): boolean {
        return (this.curValue === RelayModes.MODE_0);
    }
}