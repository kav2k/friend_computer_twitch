import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";
import { Pool } from "../db/entities/Pool";

export class UnPickCommand extends BaseCommand {
  public readonly name = "unpick";

  public async run(msg: PrivateMessage): Promise<void> {
    const { arg, isElevated } = this.parse(msg);
    let targetNickname: string | undefined;
    let pool: Pool | undefined;

    const match = arg?.match(/^(\S+)\s+(\S+)$/);

    if (match) {
      const poolName = match[1];
      pool = await this.poolRepository.findOne({name: poolName});
      if (!pool) {
        this.bot.say(`Pool "${targetNickname}" does not exist`);
      }

      targetNickname = match[2];
    } else {
      targetNickname = arg;
    }

    if (isElevated && targetNickname) {
      const userRepository = this.userRepository;
      const pickRepository = this.pickRepository;

      const user = await userRepository.preload({username: targetNickname.toLowerCase()});

      if (pool) {
        if (user) {
          const pick = await pickRepository.findOne({
            user: user,
            pool: pool
          })
          if (pick) {
            await pickRepository.remove(pick);
            this.bot.say(`User ${targetNickname} was unpicked for pool "${pool.name}"`);
          } else {
            this.bot.say(`User ${targetNickname} wasn't currently picked for pool "${pool.name}"`);
          }
        } else {
          this.bot.say(`User ${targetNickname} wasn't currently picked for pool "${pool.name}"`);
        }
      } else {
        if (user && user.picked) {
          user.picked = false;
          await userRepository.save(user);
  
          this.bot.say(`User ${targetNickname} was unpicked`);
        } else {
          this.bot.say(`User ${targetNickname} wasn't currently picked`);
        }
      }
    }
  }
}
