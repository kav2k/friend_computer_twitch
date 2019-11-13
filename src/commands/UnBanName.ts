import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";

export class UnBanNameCommand extends BaseCommand {
  public readonly name = "unbanname";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;

    const { arg: targetNickname, isElevated } = this.parse(msg);

    if (isElevated && targetNickname) {
      const user = await userRepository.preload({username: targetNickname});

      if (user) {
        if (user.eligible) {
          this.bot.say(`User ${targetNickname} was already eligible`);
        } else {
          user.eligible = true;

          await userRepository.save(user);
          this.bot.say(`User ${targetNickname} manually set as eligible`);
        }
      } else {
        await userRepository.save({
          username: targetNickname.toLowerCase(),
          nickname: targetNickname,
          eligible: true
        });
        this.bot.say(`User ${targetNickname} manually set as eligible`);
      }
    }
  }
}
