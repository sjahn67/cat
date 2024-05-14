'use strict';

export function showData(data: string): string {
  let ret = data.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
  return ret;
}

// periodic status check function
export async function periodicCheck(periodic: Function, period?: number) {
  let time: number = period || 1000;
  let wrapper = async function (periodic: Function, time: number) {

    // winston.debug(`[Periodic ${periodic.name}] Begin`);
    try {
      await periodic();
    } catch (e) {
      console.error(e.stack);
    }
    // winston.debug(`[Periodic ${periodic.name}] End`);
    setTimeout(wrapper, time, periodic, time);
  };
  wrapper(periodic, time);
}
