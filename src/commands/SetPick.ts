import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";
import { Pool } from "../db/entities/Pool";

export class SetPickCommand extends BaseCommand {
  public readonly name = "setpick";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;
    const pickRepository = this.pickRepository;
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
        this.bot.say(`No pool is currently selected, can't set pick`);
        return;
      }

      targetNickname = arg;
    }

    if (isElevated && targetNickname) {
      const user = await userRepository.preload({username: targetNickname.toLowerCase()});

      if (user) {
        let pick = await pickRepository.findOne({user: user, pool: pool})
        if (pick?.picked) {
          this.bot.say(`User ${targetNickname} was already picked for the ${pool.prettyName} pool`);
        } else {
          if (pick) {
            pick.picked = true;
            pick.pickedDate = msg.timestamp;
            pick.pickedRemark = "Picked manually";
            await pickRepository.save(pick);
          } else {
            pick = await pickRepository.save({
              user: user,
              pool: pool,
              picked: true,
              pickedDate: msg.timestamp,
              pickedRemark: "Picked manually"
            })
          }
          this.bot.say(`User ${targetNickname} manually set as picked for the ${pool.prettyName} pool`);
          this.bot.lastPick = pick;
        }
      } else {
        const newUser = await userRepository.save({
          username: targetNickname.toLowerCase(),
          nickname: targetNickname,
        });
        const pick = await pickRepository.save({
          user: newUser,
          pool: pool,
          picked: true,
          pickedDate: msg.timestamp,
          pickedRemark: "Picked manually"
        })
        this.bot.say(`User ${targetNickname} created and manually set as picked for the ${pool.prettyName} pool`);
        this.bot.lastPick = pick;
      }
    }
  }
}
