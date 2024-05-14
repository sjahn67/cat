import { join } from "path";
import * as fs from "fs";

const SCHEDULE_DATA_DIR = join(__dirname, "..", "database");
const DEFAULT_SCHEDULE_DATA_PATH = join(__dirname, "../src", "schedule-data-default.json");
const SCHEDULE_DATA_PATH = join(SCHEDULE_DATA_DIR, "schedule-data.json");

let data: object[] = null;
let json: object = null;
try {
    json = JSON.parse(fs.readFileSync(SCHEDULE_DATA_PATH, "utf8"));
    data = json["table"];

} catch (err) {
    if (!fs.existsSync(SCHEDULE_DATA_PATH)) {
        json = JSON.parse(fs.readFileSync(DEFAULT_SCHEDULE_DATA_PATH, "utf8"));
        data = json["table"];
        fs.writeFileSync(SCHEDULE_DATA_PATH, JSON.stringify(json, null, 2))
    }
    console.log("error:", err);
}

function getCurTime(): number {
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

    let current = hours * 10000 + minutes * 100 + seconds;
    // console.log(current);
    return current;
}

interface ILedInfo {
    ledValue: number,
    co2: boolean
}

export function getCurrentValue(): ILedInfo {
    const curTime = getCurTime();
    let curValue: ILedInfo = { ledValue: 0, co2: false };
    data.forEach(item => {
        if (Number(item["time"]) <= curTime) {
            curValue = { ledValue: item["ledValue"], co2: item["co2"] };
        } else {
            return;
        }
    })
    return curValue;
}
