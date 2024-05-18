import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";
import moment from "moment";
import { ACTIVE_THRESHOLD } from "../bot";
import { Brackets } from "typeorm";
import { Pool } from "../db/entities/Pool";

export class NameStatsCommand extends BaseCommand {
  public readonly name = "namestats";
  public readonly cooldown = 30 * 1000; // 30 seconds

  private last_invocation: Date | undefined;

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;
    const poolRepository = this.poolRepository;
    const settings = await this.bot.getSettings();

    const { arg, isElevated } = this.parse(msg);

    if (isElevated || (!(this.last_invocation) || (Date.now() - this.last_invocation.getTime()) >= this.cooldown)) {
      this.last_invocation = new Date();

      const cutoff = moment(msg.timestamp).subtract(ACTIVE_THRESHOLD).toDate();

      // TODO NEEDS FIXING, WIP

      // let pool: Pool | undefined;

      // if (arg) {
      //   pool = await poolRepository.findOne({name: arg});
      //   if (!pool) {
      //     this.bot.say(`Pool "${arg}" does not exist`);
      //     return;
      //   }
      // } else {
      //   if (settings.currentPool) {
      //     pool = settings.currentPool;
      //   } else {
      //     this.bot.say(`Can't pick, no pool is currently active`);
      //     return;
      //   }
      // }

      // let users: User[];

      const users = await userRepository
        .createQueryBuilder("user")
        .where("user.eligible")
        .andWhere(new Brackets((qb) => {
          qb.where("user.lastActive >= :cutoff", { cutoff })
            .orWhere("user.reserved")
            .orWhere("user.picked");
        }))
        .getMany();

      const total = users.length;
      const eligible = users.filter(user => !user.picked).length;

      const num_picked = total - eligible;
      const percent_picked = (total ? 100 * (num_picked / total) : 0).toFixed(2);
      
      this.bot.say(`Total tracked: ${total}, of which ${num_picked} (${percent_picked}%) are picked.`);

      const num_reserved = users.filter(user => user.reserved && !user.picked).length;
      const percent_reserved = (eligible ? 100 * num_reserved / eligible : 0).toFixed(2);

      const num_just_active = users.filter(user => user.lastActive && user.lastActive >= cutoff && !user.picked).length;
      const percent_just_active = (eligible ? 100 * num_just_active / eligible : 0).toFixed(2);

      const chance = (eligible ? (100 / eligible) : 0).toFixed(2);

      this.bot.say(
        `Total eligible (reserved or active and unpicked): ${eligible}, of which ${num_reserved} (${percent_reserved}%) are reserved, ` + 
        `${num_just_active} (${percent_just_active}%) are active. Pick chance: ${chance}%.`
      );
    }
  }
}
