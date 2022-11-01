import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";
import { Pool } from "../db/entities/Pool";
import { Pick } from "../db/entities/Pick";

export class UnPickCommand extends BaseCommand {
  public readonly name = "unpick";

  public async run(msg: PrivateMessage): Promise<void> {
    const settings = await this.bot.getSettings();

    const { arg, isElevated } = this.parse(msg);
    let targetNickname: string | undefined;
    let pool: Pool | null = null;
    let lastPick: Pick | null = null;

    const match = arg?.match(/^(\S+)\s+(\S+)$/);

    if (match) {
      const poolName = match[1];
      pool = await this.poolRepository.findOneBy({name: poolName});
      if (!pool) {
        this.bot.say(`Pool "${poolName}" does not exist`);
        return;
      }

      targetNickname = match[2];
    } else if (arg) {
      if (settings.currentPool) {
        pool = settings.currentPool;
      } else {
        this.bot.say(`No pool is currently selected, can't unpick`);
        return;
      }

      targetNickname = arg;
    } else if (this.bot.lastPick) {
      lastPick = await this.pickRepository.findOne({
        where: {
          id: this.bot.lastPick.id
        },
        relations: ["pool", "user"]
    });
      if (!lastPick) {
        this.bot.say(`Can't find last pick in the database!`);
        return;
      } else {
        pool = lastPick.pool;
      }
    } else {
      this.bot.say(`No last pick to unpick!`);
      return;
    }

    if (isElevated) {
      if (targetNickname) {
        const userRepository = this.userRepository;
        const pickRepository = this.pickRepository;
  
        const user = await userRepository.preload({username: targetNickname.toLowerCase()});
  
        if (user) {
          const pick = await pickRepository.findOneBy({
            user: {username: user.username},
            pool: {name: pool.name}
          })
          if (pick?.picked) {
            pick.picked = false;
            await pickRepository.save(pick);
            this.bot.say(`User ${targetNickname} was unpicked for the ${pool.prettyName} pool`);
          } else {
            this.bot.say(`User ${targetNickname} wasn't currently picked for the ${pool.prettyName} pool`);
          }
        } else {
          this.bot.say(`User ${targetNickname} wasn't currently picked for the ${pool.prettyName} pool`);
        }
      } else {
        if (lastPick) {
          lastPick.picked = false;
          this.pickRepository.save(lastPick);
          this.bot.lastPick = undefined;
          this.bot.say(`Last pick, ${lastPick.user.nickname} was unpicked for the ${pool?.prettyName} pool`);
        } else {
          this.bot.say(`No last pick to unpick!`);
        }
      }
    }
  }
}
