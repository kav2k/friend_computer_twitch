import { PrivateMessage } from "twitch-js";
import { IParsedMessage } from "./interfaces";

const COMMAND_REGEX = /^(\S+)(?:\s+(.+))?/;

export const MAX_CUSTOM_LENGTH = 10;

export const LEGAL_CHARACTERS = "abcdefghijklmnopqrstuvwxyz" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + " 1234567890!?.,-\"“”'‘’/…♂♀";

export const LEGAL_REGEX = new RegExp(`^.+$`);

export function parseMessage(msg: PrivateMessage, prefix: string): IParsedMessage {
  const parsed: IParsedMessage = {
    username: msg.username,
    nickname: msg.tags.displayName || msg.username,
    isElevated: !!(msg.tags.badges.broadcaster || msg.tags.badges.moderator),
    isBroadcaster: !!msg.tags.badges.broadcaster
  };

  if (msg.message?.startsWith(prefix)) {
    const match = msg.message.slice(prefix.length).match(COMMAND_REGEX);
    if (match) {
      return {
        commandName: match[1].toLowerCase(),
        arg: match[2],
        ...parsed
      };
    } else {
      return parsed;
    }
  } else {
    return parsed;
  }
}

export function pickRandom<T>(candidates: T[]): T | null {
  if (candidates.length) {
    const randIndex = Math.floor(candidates.length * Math.random());
    console.log(randIndex);
    return candidates[randIndex];
  } else {
    return null;
  }
}
