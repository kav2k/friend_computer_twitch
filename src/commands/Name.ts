import { PrivateMessage } from "twitch-js";
import { MAX_CUSTOM_LENGTH } from "../utils";
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

      if (customName && customName.length > MAX_CUSTOM_LENGTH) {
        this.bot.queueUpdate("Custom name too long for:", nickname);
      } else if (customName) {
        user.reserved = true;
        user.customName = customName;
        userRepository.save(user);
        this.bot.queueUpdate("Custom name reserved for:", `${nickname} "${customName}"`);
      } else {
        user.reserved = true;
        user.customName = null;
        userRepository.save(user);
        this.bot.queueUpdate("Name reserved for:", nickname);
      }
    }
  }
}
