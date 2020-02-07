import { PrivateMessage } from "twitch-js";
import { MAX_CUSTOM_LENGTH } from "../utils";
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

        if (customName && customName.length > MAX_CUSTOM_LENGTH) {
          this.bot.queueUpdate("Custom name too long for:", targetNickname);
        } else if (customName) {
          user.reserved = true;
          user.customName = customName;
          userRepository.save(user);
          this.bot.queueUpdate("Custom name reserved for:", `${targetNickname} "${customName}"`);
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
