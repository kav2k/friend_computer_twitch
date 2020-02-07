import { PrivateMessage } from "twitch-js";
import { LEGAL_CHARACTERS, LEGAL_REGEX, MAX_CUSTOM_LENGTH } from "../utils";
import { BaseCommand } from "./BaseCommand";

export class NameCommand extends BaseCommand {
  public readonly name = "name";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;

    const { username, nickname, arg: customName } = this.parse(msg);

    const user = await userRepository.preload({username});

    if (user && user.eligible) {
      if (user.picked) {
        this.bot.queueUpdate("Name already picked for:", nickname);
        return;
      }

      if (
        user.reserved &&
        ((user.customName === customName) || (!user.customName && !customName))
      ) {
        this.bot.queueUpdate("Name already reserved for:", nickname);
        return;
      }

      if (customName && !customName.match(LEGAL_REGEX)) {
        this.bot.queueUpdate("Illegal characters in custom name for:", nickname);
        this.bot.queueUpdate("Accepted characters:", LEGAL_CHARACTERS);
      } else if (customName && customName.length > MAX_CUSTOM_LENGTH) {
        this.bot.queueUpdate(`Custom name too long (max ${MAX_CUSTOM_LENGTH}) for:`, nickname);
      } else if (customName) {
        user.reserved = true;
        user.customName = customName;
        userRepository.save(user);
        this.bot.queueUpdate("Custom name reserved for:", `${nickname} "${customName}"`);
      } else if (!nickname.match(LEGAL_REGEX)) {
        this.bot.queueUpdate("Illegal characters in username, use a custom name:", nickname);
        this.bot.queueUpdate("Accepted characters:", LEGAL_CHARACTERS);
      } else if (nickname.length > MAX_CUSTOM_LENGTH) {
        this.bot.queueUpdate(`Nickname too long (max ${MAX_CUSTOM_LENGTH}), pick a custom name:`, nickname);
      } else {
        user.reserved = true;
        user.customName = null;
        userRepository.save(user);
        this.bot.queueUpdate("Name reserved for:", nickname);
      }
    }
  }
}
