import moment from "moment";
import { PrivateMessage } from "twitch-js";
import { Brackets } from "typeorm";
import { ACTIVE_THRESHOLD } from "../bot";
import { pickRandom } from "../utils";
import { BaseCommand } from "./BaseCommand";
import { Pool, PoolType } from "../db/entities/Pool";
import { User } from "../db/entities/User";

export class PickCommand extends BaseCommand {
  public readonly name = "pick";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;
    const poolRepository = this.poolRepository;

    const { arg, isElevated } = this.parse(msg);

    if (isElevated) {
      const cutoff = moment(msg.timestamp).subtract(ACTIVE_THRESHOLD).toDate();
      let pool: Pool | undefined;

      if (arg) {
        pool = await poolRepository.findOne({name: arg});
        if (!pool) {
          this.bot.say(`Pool "${arg}" does not exist`);
          return;
        }
      }

      if (pool) {
        const pickedQb = this.pickRepository
          .createQueryBuilder("pick")
          .select(`pick."userUsername"`)
          .where(`pick."poolName" = :pool`, { pool: pool.name });

        let candidates: User[];
        
        switch (pool.type) {
          case PoolType.ACTIVE_ONLY:
            candidates = await userRepository
              .createQueryBuilder("user")
              .where("user.eligible")
              .andWhere(`user.username NOT IN (${pickedQb.getQuery()})`)
              .setParameters(pickedQb.getParameters())
              .andWhere("user.lastActive >= :cutoff", { cutoff })
              .getMany();
            break;
          default:
            candidates = await userRepository
              .createQueryBuilder("user")
              .where("user.eligible")
              .andWhere(`user.username NOT IN (${pickedQb.getQuery()})`)
              .setParameters(pickedQb.getParameters())
              .andWhere(new Brackets((qb) => {
                qb.where("user.lastActive >= :cutoff", { cutoff })
                  .orWhere("user.reserved");
              }))
              .getMany();
        }

        const winner = pickRandom(candidates);

        if (winner) {
          const name = winner.nickname;
          let reason = "";

          if (pool.type != PoolType.ACTIVE_ONLY) {
            if (winner.reserved) {
              if (winner.customName) {
                reason = `reserved name by ${winner.nickname}`;
              } else {
                reason = "reserved name";
              }
            } else {
              reason = `active ${moment(winner.lastActive).fromNow()}`;
            }
          } else {
            reason = `active ${moment(winner.lastActive).fromNow()}`;
          }

          await this.pickRepository.save({
            user: winner,
            pool: pool,
            pickedDate: msg.timestamp,
            pickedRemark: "Picked randomly"
          });

          this.bot.say(`@${this.bot.config.broadcaster} Name picked for pool "${pool.name}": "${name}" (${reason})`);
        } else {
          this.bot.say(`No eligible candidates for pool "${pool.name}"!`);
        }
      } else {
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

          winner.picked = true;
          winner.pickedDate = msg.timestamp;
          winner.pickedRemark = "Picked randomly";

          await userRepository.save(winner);

          this.bot.say(`@${this.bot.config.broadcaster} Name picked: "${name}" (${reason})`);
        } else {
          this.bot.say("No eligible candidates!");
        }
      }
    }
  }
}
