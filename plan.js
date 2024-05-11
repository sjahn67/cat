const m = module.exports = {};

const data = [
    { time: 0, value: 0 },
    { time: 80000, value: 10 },
    { time: 83000, value: 20 },
    { time: 90000, value: 30 },
    { time: 93000, value: 40 },
    { time: 100000, value: 60 },
    { time: 103000, value: 80 },
    { time: 110000, value: 100 },
    { time: 150000, value: 80 },
    { time: 153000, value: 75 },
    { time: 160000, value: 70 },
    { time: 163000, value: 65 },
    { time: 170000, value: 60 },
    { time: 173000, value: 55 },
    { time: 180000, value: 40 },
    { time: 183000, value: 35 },
    { time: 190000, value: 30 },
    { time: 230000, value: 10 }
];

function getCurTime() {
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

m.getCurrentValue = function () {
    const curTime = getCurTime();
    let curValue = 0;
    data.forEach(item => {
        if (item.time <= curTime) {
            curValue = item.value;
        } else {
            return;
        }
    })
    return curValue;
}
