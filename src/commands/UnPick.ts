import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";

export class UnPickCommand extends BaseCommand {
  public readonly name = "unpick";

  public async run(msg: PrivateMessage): Promise<void> {
    const { isElevated, arg: targetNickname } = this.parse(msg);

    if (isElevated && targetNickname) {
      const userRepository = this.userRepository;

      const user = await userRepository.preload({username: targetNickname.toLowerCase()});

      if (user && user.picked) {
        user.picked = false;
        await userRepository.save(user);

        this.bot.say(`User ${targetNickname} was unpicked`);
      } else {
        this.bot.say(`User ${targetNickname} wasn't currently picked`);
      }
    }
  }
}
