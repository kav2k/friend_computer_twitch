import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";
import { Pool } from "../db/entities/Pool";

export class UnPickCommand extends BaseCommand {
  public readonly name = "unpick";

  public async run(msg: PrivateMessage): Promise<void> {
    const settings = await this.bot.getSettings();

    const { arg, isElevated } = this.parse(msg);
    let targetNickname: string | undefined;
    let pool: Pool | undefined;

    const match = arg?.match(/^(\S+)\s+(\S+)$/);

    if (match) {
      const poolName = match[1];
      pool = await this.poolRepository.findOne({name: poolName});
      if (!pool) {
        this.bot.say(`Pool "${poolName}" does not exist`);
        return;
      }

      targetNickname = match[2];
    } else {
      if (settings.currentPool) {
        pool = settings.currentPool;
      } else {
        this.bot.say(`No pool is currently selected, can't unpick`);
        return;
      }

      targetNickname = arg;
    }

    if (isElevated && targetNickname) {
      const userRepository = this.userRepository;
      const pickRepository = this.pickRepository;

      const user = await userRepository.preload({username: targetNickname.toLowerCase()});

      if (user) {
        const pick = await pickRepository.findOne({
          user: user,
          pool: pool
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
    }
  }
}
