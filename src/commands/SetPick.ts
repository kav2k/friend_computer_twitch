import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";

export class SetPickCommand extends BaseCommand {
  public readonly name = "setpick";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;

    const { arg: targetNickname, isElevated } = this.parse(msg);

    if (isElevated && targetNickname) {
      const user = await userRepository.preload({username: targetNickname});

      if (user) {
        if (user.picked) {
          this.bot.say(`User ${targetNickname} was already picked`);
        } else {
          user.picked = true;
          user.pickedDate = msg.timestamp;
          user.pickedRemark = "Picked manually";

          await userRepository.save(user);
          this.bot.say(`User ${targetNickname} manually set as picked`);
        }
      } else {
        await userRepository.save({
          username: targetNickname.toLowerCase(),
          nickname: targetNickname,
          picked: true,
          pickedDate: msg.timestamp,
          pickedRemark: "Picked manually"
        });
        this.bot.say(`User ${targetNickname} manually set as picked`);
      }
    }
  }
}
