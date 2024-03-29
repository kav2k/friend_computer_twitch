import moment from "moment";
import { PrivateMessage } from "twitch-js";
import { Pool } from "../db/entities/Pool";
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

  private async queueResponse(user: User, nickname: string) {
    const settings = await this.bot.getSettings();

    if (!settings.currentPool) {
      this.bot.queueUpdate("No name pool is currently active,", nickname);
      return;
    }

    const pool = settings.currentPool;

    const pick = await this.pickRepository.findOneBy({pool: {name: pool.name}, user: {username: user.username}});

    if (!user.eligible) {
      this.bot.queueUpdate("Banned from name picking:", nickname);
    } else if (pick?.picked) {
      this.bot.queueUpdate(`Name already picked in the ${pool.prettyName} pool on ${moment(pick.pickedDate).format("YYYY-MM-DD")} for:`, nickname);
    } else if (pool.allowsReservation && pick?.reserved && pick?.customName) {
      this.bot.queueUpdate(`Custom name reserved in the ${pool.prettyName} pool for:`, `${nickname} "${pick.customName}"`);
    } else if (pool.allowsReservation && pick?.reserved) {
      this.bot.queueUpdate(`Name reserved in the ${pool.prettyName} pool for:`, nickname);
    } else if (pool.allowsReservation) {
      this.bot.queueUpdate(`Eligible to be picked if active (NOT reserved yet) in the ${pool.prettyName} pool:`, nickname);
    } else {
      this.bot.queueUpdate(`Eligible to be picked if active the ${pool.prettyName} pool:`, nickname);
    }
  }
}
