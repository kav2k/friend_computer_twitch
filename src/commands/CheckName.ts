import { PrivateMessage } from "twitch-js";
import { User } from "../db/entities/User";
import { BaseCommand } from "./BaseCommand";

export class CheckNameCommand extends BaseCommand {
  public readonly name = "checkname";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;

    const { username, nickname, arg: targetNickname, isElevated } = this.parse(msg);

    if (isElevated && targetNickname) {
      const user = await userRepository.preload({username: targetNickname.toLowerCase()});

      if (user) {
        this.queueResponse(user, targetNickname);
      } else {
        this.bot.say(`No data found for ${targetNickname}`);
      }
    } else {
      const user = await userRepository.preload({username});

      if (user) {
        this.queueResponse(user, nickname);
      }
    }
  }

  private queueResponse(user: User, nickname: string) {
    if (!user.eligible) {
      this.bot.queueUpdate("Banned from name picking:", nickname);
    } else if (user.picked) {
      this.bot.queueUpdate("Name already picked for:", nickname);
    } else if (user.reserved && user.customName) {
      this.bot.queueUpdate("Custom name reserved for:", `${nickname} "${user.customName}"`);
    } else if (user.reserved) {
      this.bot.queueUpdate("Name reserved for:", nickname);
    } else {
      this.bot.queueUpdate("Eligible to be picked if active (NOT reserved yet):", nickname);
    }
  }
}
