import moment from "moment";
import { PrivateMessage } from "twitch-js";
import { Brackets } from "typeorm";
import { ACTIVE_THRESHOLD } from "../bot";
import { pickRandom } from "../utils";
import { BaseCommand } from "./BaseCommand";

export class PickCommand extends BaseCommand {
  public readonly name = "pick";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;

    const { isElevated } = this.parse(msg);

    if (isElevated) {
      const cutoff = moment(msg.timestamp).subtract(ACTIVE_THRESHOLD).toDate();

      const candidates = await userRepository
        .createQueryBuilder("user")
        .where("user.eligible")
        .andWhere("NOT user.picked")
        .andWhere(new Brackets((qb) => {
          qb.where("user.lastActive >= :cutoff", { cutoff })
            .orWhere("user.reserved");
        }))
        .getMany();

      const winner = pickRandom(candidates);
      if (winner) {
        const name = winner.customName ?? winner.nickname;
        let reason = "";

        if (winner.reserved) {
          if (winner.customName) {
            reason = `reserved name by ${winner.nickname}`;
          } else {
            reason = "reserved name";
          }
        } else {
          reason = `active ${moment(winner.lastActive).fromNow()}`;
        }

        this.bot.say(`@${this.bot.config.broadcaster} Name picked: "${name}" (${reason})`);

        winner.picked = true;
        winner.pickedDate = msg.timestamp;
        winner.pickedRemark = "Picked randomly";

        await userRepository.save(winner);
      } else {
        this.bot.say("No eligible candidates!");
      }
    }
  }
}
