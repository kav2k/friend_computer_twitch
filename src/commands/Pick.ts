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
    const settings = await this.bot.getSettings();

    const { arg, isElevated } = this.parse(msg);

    if (isElevated) {
      const cutoff = moment(msg.timestamp).subtract(ACTIVE_THRESHOLD).toDate();
      let pool: Pool | null = null;

      if (arg) {
        pool = await poolRepository.findOneBy({name: arg});
        if (!pool) {
          this.bot.say(`Pool "${arg}" does not exist`);
          return;
        }
      } else {
        if (settings.currentPool) {
          pool = settings.currentPool;
        } else {
          this.bot.say(`Can't pick, no pool is currently active`);
          return;
        }
      }

      // const pickedQb = this.pickRepository
      //   .createQueryBuilder("pick")
      //   .select(`pick."userUsername"`)
      //   .where(`pick."poolName" = :pool`, { pool: pool.name })
      //   .andWhere(`pick."picked"`);

      let candidates: User[];

      let notPickedQuery = userRepository
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.picks", "pick", "pick.pool = :pool", { pool: pool.name })
        .where("user.eligible")
        .andWhere("COALESCE(pick.picked, FALSE) = FALSE");
      
      switch (pool.type) {
        case PoolType.ACTIVE_ONLY:
          candidates = await notPickedQuery
            .andWhere("user.lastActive >= :cutoff", { cutoff })
            .getMany();
          break;
        case PoolType.CLASSIC:
        default:
          candidates = await notPickedQuery
            .andWhere(new Brackets((qb) => {
              qb.where("user.lastActive >= :cutoff", { cutoff })
                .orWhere("pick.reserved");
            }))
            .getMany();
      }

      const winner = pickRandom(candidates);

      if (winner) {
        let name = winner.nickname;
        let reason = "";

        let maybePick = await this.pickRepository.findOneBy({ pool: { name: pool.name }, user: { username: winner.username } });

        if (maybePick?.reserved) {
          if (maybePick.customName) {
            name = maybePick.customName;
            reason = `reserved name by ${winner.nickname}`;
          } else {
            reason = "reserved name";
          }
        } else {
          reason = `active ${moment(winner.lastActive).fromNow()}`;
        }

        if (maybePick) {
          maybePick.picked = true;
          maybePick.pickedDate = msg.timestamp;
          maybePick.pickedRemark = `Picked randomly, ${reason}`;
          await this.pickRepository.save(maybePick);
        } else {
          maybePick = await this.pickRepository.save({
            user: winner,
            pool: pool,
            picked: true,
            pickedDate: msg.timestamp,
            pickedRemark: `Picked randomly, ${reason}` 
          });
        }

        if (maybePick) {
          this.bot.say(`@${this.bot.config.broadcaster} Name picked for the ${pool.prettyName} pool: "${name}" (${reason})`);
          this.bot.lastPick = maybePick;
        }
      } else {
        this.bot.say(`No eligible candidates for the ${pool.prettyName} pool!`);
      }
    }
  }
}
