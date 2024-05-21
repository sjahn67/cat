import { Cat } from "../globals";
import { NODE_ENV, NodeEnvTypes } from "../constants";
import { RelayModes } from "../raspPi4B-hw";

const Gpio = (NODE_ENV === NodeEnvTypes.NODE_ENV_DEV) ? require("pigpio-mock").Gpio : require("pigpio").Gpio;
// import { Gpio } from "pigpio";
export class relayClass {
    private relay;
    private curValue: number;
    constructor(gpioNumber: number) {
        this.relay = new Gpio(gpioNumber, { mode: Gpio.OUTPUT });
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