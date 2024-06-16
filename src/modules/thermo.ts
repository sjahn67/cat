import { readFileSync } from 'node:fs';

export async function get_temp(): Promise<number> {
    const temp: number = Number(readFileSync("/sys/class/thermal/thermal_zone0/temp"));
    const temp_c: number = temp / 1000;
    return temp_c
}