'use strict';

let m = module.exports = {};

let showData = m.showData = function (data) {
  let ret = data.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
  return ret;
}

// periodic status check function
m.periodicCheck = async function (periodic, period) {
  let time = period || 1000;
  let wrapper = async function(periodic, time) {
    
      // winston.debug(`[Periodic ${periodic.name}] Begin`);
      try {
        await periodic();
      } catch (e) {
        winston.error(e.stack);
      }
      // winston.debug(`[Periodic ${periodic.name}] End`);
      setTimeout(wrapper, time, periodic, time);
  };
  wrapper(periodic, time);
}
