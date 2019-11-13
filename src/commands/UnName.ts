import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";

export class UnNameCommand extends BaseCommand {
  public readonly name = "unname";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;

    const { username, nickname, arg: targetUsername, isElevated } = this.parse(msg);

    if (isElevated && targetUsername) {
      const user = await userRepository.preload({username: targetUsername.toLowerCase()});

      if (user && user.reserved) {
        user.reserved = false;
        user.customName = null;
        userRepository.save(user);
        this.bot.queueUpdate("Name reservation cleared for:", targetUsername);
      } else {
        this.bot.queueUpdate("No reservation found for:", targetUsername);
      }
    } else {
      const user = await userRepository.preload({username});

      if (user && user.reserved) {
        user.reserved = false;
        user.customName = null;
        userRepository.save(user);

        this.bot.queueUpdate("Name reservation cleared for:", nickname);
      } else {
        this.bot.queueUpdate("No reservation found for:", nickname);
      }
    }
  }
}
