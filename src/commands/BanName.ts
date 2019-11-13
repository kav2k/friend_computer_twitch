import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";

export class BanNameCommand extends BaseCommand {
  public readonly name = "banname";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;

    const { arg: targetNickname, isElevated } = this.parse(msg);

    if (isElevated && targetNickname) {
      const user = await userRepository.preload({username: targetNickname});

      if (user) {
        if (!user.eligible) {
          this.bot.say(`User ${targetNickname} was already ineligible`);
        } else {
          user.eligible = false;

          await userRepository.save(user);
          this.bot.say(`User ${targetNickname} manually set as ineligible`);
        }
      } else {
        await userRepository.save({
          username: targetNickname.toLowerCase(),
          nickname: targetNickname,
          eligible: false
        });
        this.bot.say(`User ${targetNickname} manually set as ineligible`);
      }
    }
  }
}
