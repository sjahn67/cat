import { DB_DIR_PATH } from "./constants";
import * as dbService from "./database/file-database";
import { IProgramConfig } from "./interfaces/interface-program-config";

interface ICatGlobal {
  ProgramConfig: IProgramConfig;
}

export var Cat: ICatGlobal = {
  ProgramConfig: dbService.getProgramConfig(),
}
