import { IConfig } from "./interfaces";
import { promises as fsPromises } from "fs";

export async function loadConfig(path = "../config.json"): Promise<IConfig> {
  const configString = await fsPromises.readFile(path);
  return JSON.parse(configString.toString());
}

export async function saveConfig(config: IConfig, path = "../config.json"): Promise<void> {
  await fsPromises.writeFile(path, JSON.stringify(config, null, 2));
}
