import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";
import { Pool } from "../db/entities/Pool";

export class SetPickCommand extends BaseCommand {
  public readonly name = "setpick";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;
    const pickRepository = this.pickRepository;

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
      const user = await userRepository.preload({username: targetNickname.toLowerCase()});

      if (user) {
        if (pool) {
          const pick = await pickRepository
            .findOne({user: user, pool: pool})
          if (pick) {
            this.bot.say(`User ${targetNickname} was already picked for pool "${pool.name}"`);
          } else {
            await pickRepository.save({
              user: user,
              pool: pool,
              pickedDate: msg.timestamp,
              pickedRemark: "Picked manually"
            })
            this.bot.say(`User ${targetNickname} manually set as picked for pool "${pool.name}"`);
          }
        } else {
          if (user.picked) {
            this.bot.say(`User ${targetNickname} was already picked`);
          } else {
            user.picked = true;
            user.pickedDate = msg.timestamp;
            user.pickedRemark = "Picked manually";
  
            await userRepository.save(user);
            this.bot.say(`User ${targetNickname} manually set as picked`);
          }
        }
      } else {
        if (pool) {
          const newUser = await userRepository.save({
            username: targetNickname.toLowerCase(),
            nickname: targetNickname,
          });
          await pickRepository.save({
            user: newUser,
            pool: pool,
            pickedDate: msg.timestamp,
            pickedRemark: "Picked manually"
          })
          this.bot.say(`User ${targetNickname} created and manually set as picked for pool "${pool.name}"`);
        } else {
          await userRepository.save({
            username: targetNickname.toLowerCase(),
            nickname: targetNickname,
            picked: true,
            pickedDate: msg.timestamp,
            pickedRemark: "Picked manually"
          });
          this.bot.say(`User ${targetNickname} created and manually set as picked`);
        }
      }
    }
  }
}
