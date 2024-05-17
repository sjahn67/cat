import { DB_DIR_PATH } from "../constants";
import { Json } from "../interfaces/interface-json";

import { join } from "path";
import * as fs from "fs";

interface IDataInfo {
    time: string,
    ledValue: number,
    ledDelta?: number,
    co2: boolean
}

interface IValueInfo {
    ledValue: number,
    co2: boolean
}

const DEFAULT_SCHEDULE_DATA_PATH = join(__dirname, "../database", "schedule-data-default.json");
const SCHEDULE_DATA_PATH = join(DB_DIR_PATH, "schedule-data.json");

export class planManager {
    data: IDataInfo[];

    constructor() {
        let json: Json;
        try {
            json = JSON.parse(fs.readFileSync(SCHEDULE_DATA_PATH, "utf8"));
            this.data = json["table"];

        } catch (err) {
            if (!fs.existsSync(SCHEDULE_DATA_PATH)) {
                json = JSON.parse(fs.readFileSync(DEFAULT_SCHEDULE_DATA_PATH, "utf8"));
                this.data = json["table"];
                fs.writeFileSync(SCHEDULE_DATA_PATH, JSON.stringify(json, null, 2))
            }
            console.log("error:", err);
        }

        // calculate delta
        let sData: IDataInfo = null;
        this.data.forEach(item => {
            if (sData !== null) {
                const mStart: number = this.getMinTime(sData.time);
                const mEnd: number = this.getMinTime(item.time);
                item.ledDelta = 0; // init current data.
                sData.ledDelta = (item.ledValue - sData.ledValue) / (mEnd - mStart);
                console.log(`sData:${sData}`);
                sData = item;
            } else {
                sData = item;
            }
        })
        console.log(this.data);
    }

    private getMinTime(source: string | number): number {
        let ret = 0;
        switch (typeof source) {
            case 'string': {
                ret = Number(source.substring(0, 2)) * 60 + Number(source.substring(2, 4));
                break;
            }
            case 'number':
            default: {
                ret = (source - (source % 100)) / 100 * 60 + source % 100;
            }
        }
        return ret;
    }

    private getCurTime(): number {
        let date_time = new Date();
        // get current date
        // adjust 0 before single digit date
        let date = ("0" + date_time.getDate()).slice(-2);
        // get current month
        let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
        // get current year
        let year = date_time.getFullYear();
        // get current hours
        let hours = date_time.getHours();
        // get current minutes
        let minutes = date_time.getMinutes();
        // get current seconds
        let seconds = date_time.getSeconds();

        // prints date & time in YYYY-MM-DD HH:MM:SS format
        console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);

        let current = hours * 100 + minutes;
        // console.log(current);
        return current;
    }

    public getCurrentValue(): IValueInfo {
        const curTime = this.getCurTime();
        let curValue: IDataInfo = null;
        this.data.forEach(item => {
            if (Number(item.time) <= curTime) {
                curValue = item;
            } else {
                return;
            }
        })
        let ret: IValueInfo = null;
        if (curValue !== null) {
            ret = {
                ledValue: curValue.ledValue + (this.getMinTime(curTime) - this.getMinTime(curValue.time)) * curValue.ledDelta,
                co2: curValue.co2
            }
        } else {
            ret = { ledValue: 0, co2: false }
        }

        return ret;
    }

}