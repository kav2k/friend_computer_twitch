import { PrivateMessage } from "twitch-js";
import { Bot } from "./bot";

export interface IConfig {
  token: string;
  username: string;
  channel: string;
  broadcaster: string;
  prefix: string;
}

export interface ICommand {
  readonly name: string;
  run(msg: PrivateMessage): Promise<void>;
}

export interface IParsedMessage {
  username: string;
  nickname: string;
  message?: string;
  commandName?: string;
  arg?: string;
  isElevated: boolean;
  isBroadcaster: boolean;
}
