import { PrivateMessage } from "twitch-js";
import { PoolType } from "../db/entities/Pool";
import { BaseCommand } from "./BaseCommand";

export class SetNameCommand extends BaseCommand {
  public readonly name = "setname";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;
    const settings = await this.bot.getSettings();

    const { arg, isElevated } = this.parse(msg);
    const match = arg?.match(/^(\S+)(?:\s+(.*))?$/);

    if (isElevated && match) {
      const [, targetNickname, customName] = match;

      if (!settings.currentPool) {
        this.bot.say(`No pool is currently selected, can't set name`);
        return;
      }

      const pool = settings.currentPool;
      if (!pool.allowsReservation) {
        this.bot.say(`Name pool ${pool.prettyName} does not allow reservation, can't set name`);
      }

      let user = await userRepository.preload({username: targetNickname.toLowerCase()});

      if (!user) {
        user = userRepository.create({
          username: targetNickname.toLowerCase(),
          nickname: targetNickname,
          eligible: true
        });
      }

      if (user && user.eligible) {
        let pick = await this.pickRepository.findOneBy({user: {username: user.username}, pool: {name: pool.name}})
        if (pick?.picked) {
          this.bot.say(`User ${targetNickname} was already picked for the ${pool.prettyName} pool`);
        } else {
          if (!pick) {
            pick = this.pickRepository.create({user: user, pool: pool});
          }

          if (
            pick.reserved &&
            ((pick.customName === customName) || (!pick.customName && !customName))
          ) {
            this.bot.queueUpdate(`Name already reserved in the ${pool.prettyName} pool for:`, targetNickname);
            return;
          }

          pick.customName = customName || null;
          pick.reservedDate = msg.timestamp;
          pick.reserved = true;

          if (pool.validateName(customName || user.nickname)) {
            await this.pickRepository.save(pick);
          } else {
            this.bot.say(`Invalid name "${customName || user.nickname}" by ${pool.prettyName} pool rules`);
            if (pool.validRemark) {
              this.bot.queueUpdate(`Name validity rules for ${pool.prettyName} pool:`, pool.validRemark);
            }
            return;
          }
          
          this.bot.say(`User ${targetNickname} manually set as reserved with name "${customName || user.nickname}" for the ${pool.prettyName} pool`);
        }
      }
    }
  }
}
