'use strict';

export function showData(data: string): string {
  let ret = data.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
  return ret;
}

// periodic status check function
export async function periodicCheck(periodic: Function, period?: number | (() => number)) {
  const getTime = () => {
    if (typeof period === 'function') return period();
    return period || 1000;
  };
  let wrapper = async function (periodic: Function) {

    // winston.debug(`[Periodic ${periodic.name}] Begin`);
    try {
      await periodic();
    } catch (e) {
      console.error(e.stack);
    }
    // winston.debug(`[Periodic ${periodic.name}] End`);
    setTimeout(wrapper, getTime(), periodic);
  };
  wrapper(periodic);
}
