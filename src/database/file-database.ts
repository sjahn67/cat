import { DB_DIR_PATH } from "../constants";
import { Cat } from "../globals";
import * as winston from "winston";

import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import { Json } from "../interfaces/interface-json";
import { IProgramConfig } from "../interfaces/interface-program-config";

function getDefault(top: Json, item: string, defaultValue: Json): Json {
  let itemUndefined: boolean = _.isUndefined(top[item])
  let ret: Json;
  if (itemUndefined) {
    ret = defaultValue;
  } else {
    ret = top[item];
    delete top[item];
  }
  return ret;
}

export function getProgramConfig(): IProgramConfig {
  winston.info("Database.getProgramConfig()");
  const PROGRAM_CONFIG_FILE_NAME = "program-config.json";
  const PROGRAM_CONFIG_FILE_PATH = path.join(DB_DIR_PATH, PROGRAM_CONFIG_FILE_NAME);
  const DEFAULT_PROGRAM_CONFIG_FILE_NAME = "program-config-default.json";
  const DEFAULT_PROGRAM_CONFIG_FILE_PATH = path.join(__dirname, DEFAULT_PROGRAM_CONFIG_FILE_NAME);

  let json: IProgramConfig;
  try {
    const jsonCurrent: object = JSON.parse(fs.readFileSync(PROGRAM_CONFIG_FILE_PATH, "utf8"));
    const jsonFactory: IProgramConfig = JSON.parse(fs.readFileSync(DEFAULT_PROGRAM_CONFIG_FILE_PATH, "utf8"));

    if (_.isUndefined(jsonCurrent['version'])) {
      jsonCurrent['version'] = 0;
    }
    //updata config file
    if (jsonCurrent['version'] < jsonFactory.version) {
      winston.warn("update config file to version ", jsonFactory.version);
      json = Object.assign({}, jsonFactory, jsonCurrent);
      json.version = jsonFactory.version;
      // console.info(json);
      switch (jsonCurrent['version']) {

        default: {
          break;
        }
      }
      fs.writeFileSync(PROGRAM_CONFIG_FILE_PATH, JSON.stringify(json, null, 2));
    } else {
      json = jsonCurrent as IProgramConfig;
    }
  } catch (error) {
    winston.warn("    " + error);
    json = JSON.parse(fs.readFileSync(DEFAULT_PROGRAM_CONFIG_FILE_PATH, "utf8"));
    fs.writeFileSync(PROGRAM_CONFIG_FILE_PATH, JSON.stringify(json, null, 2));
  }

  return json;
};

export function saveProgramConfig(myProgramConfig: IProgramConfig): boolean {
  winston.info("Database.saveProgramConfig()");
  let PROGRAM_CONFIG_FILE_NAME = "program-config.json";
  let PROGRAM_CONFIG_FILE_PATH = path.join(DB_DIR_PATH, PROGRAM_CONFIG_FILE_NAME);
  let saveBuffer = Object.assign({}, myProgramConfig);
  let json = JSON.stringify(saveBuffer, null, 2);
  try {
    fs.writeFileSync(PROGRAM_CONFIG_FILE_PATH, json);
  } catch (error) {
    winston.error("Save config error" + error);
    return false;
  }

  Cat.ProgramConfig = myProgramConfig;
  return true;
};
