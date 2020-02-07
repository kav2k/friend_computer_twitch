import { PrivateMessage } from "twitch-js";
import { LEGAL_CHARACTERS, LEGAL_REGEX, MAX_CUSTOM_LENGTH } from "../utils";
import { BaseCommand } from "./BaseCommand";

export class SetNameCommand extends BaseCommand {
  public readonly name = "setname";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;

    const { arg, isElevated } = this.parse(msg);
    const match = arg?.match(/^(\S+)(?:\s+(.*))?$/);

    if (isElevated && match) {
      const [, targetNickname, customName] = match;

      let user = await userRepository.preload({username: targetNickname.toLowerCase()});

      if (!user) {
        user = userRepository.create({
          username: targetNickname.toLowerCase(),
          nickname: targetNickname,
          eligible: true
        });
      }

      if (user && user.eligible) {
        if (user.picked) {
          this.bot.queueUpdate("Name already picked for:", targetNickname);
          return;
        }

        if (
          user.reserved &&
          ((user.customName === customName) || (!user.customName && !customName))
        ) {
          this.bot.queueUpdate("Name already reserved for:", targetNickname);
          return;
        }

        if (customName && !customName.match(LEGAL_REGEX)) {
          this.bot.queueUpdate("Illegal characters in custom name for:", targetNickname);
          this.bot.queueUpdate("Accepted characters:", LEGAL_CHARACTERS);
        } else if (customName && customName.length > MAX_CUSTOM_LENGTH) {
          this.bot.queueUpdate(`Custom name too long (max ${MAX_CUSTOM_LENGTH}) for:`, targetNickname);
        } else if (customName) {
          user.reserved = true;
          user.customName = customName;
          userRepository.save(user);
          this.bot.queueUpdate("Custom name reserved for:", `${targetNickname} "${customName}"`);
        } else if (!targetNickname.match(LEGAL_REGEX)) {
          this.bot.queueUpdate("Illegal characters in username, use a custom name:", targetNickname);
          this.bot.queueUpdate("Accepted characters:", LEGAL_CHARACTERS);
        } else if (targetNickname.length > MAX_CUSTOM_LENGTH) {
          this.bot.queueUpdate(`Nickname too long (max ${MAX_CUSTOM_LENGTH}), pick a custom name:`, targetNickname);
        } else {
          user.reserved = true;
          user.customName = null;
          userRepository.save(user);
          this.bot.queueUpdate("Name reserved for:", targetNickname);
        }
      }
    }
  }
}
