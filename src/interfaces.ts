import { PrivateMessage } from "twitch-js";
import { Bot } from "./bot";

export interface IConfig {
  token: string;
  refresh_token: string;
  client_id: string;
  client_secret: string;
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

export interface IAuthResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string[];
  token_type: string;
}