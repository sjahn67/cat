import { join } from "path";

export enum NodeEnvTypes {
  NODE_ENV_DEV = "development",
  NODE_ENV_PRO = "production"
}
export enum RelayModes {
  MODE_0 = 0,
  MODE_1 = 1
}
export const NODE_ENV: string = (process.env.NODE_ENV !== undefined) ? process.env.NODE_ENV : NodeEnvTypes.NODE_ENV_DEV;
export const DB_DIR_PATH: string = join(process.cwd(), "database");
export const ROOT_DIR: string = join(__dirname, "../");

export enum LogLevels {
  debug = "debug",
  verbose = "verbose",
  info = "info",
  warn = "warn",
  error = "error"
}