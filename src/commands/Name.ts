import moment from "moment";
import { PrivateMessage } from "twitch-js";
import { PoolType } from "../db/entities/Pool";
import { BaseCommand } from "./BaseCommand";

export class NameCommand extends BaseCommand {
  public readonly name = "name";

  // public async run(msg: PrivateMessage): Promise<void> {
  //   const { username, nickname, arg: customName } = this.parse(msg);

  //   this.bot.queueUpdate("Name reservation system is currently disabled! Wait for the next stream series to start,", nickname);
  //   return;
  // }

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;
    const settings = await this.bot.getSettings();

    const { username, nickname, arg: customName } = this.parse(msg);

    if (!settings.currentPool) {
      this.bot.queueUpdate("No name pool is currently active,", nickname);
      return;
    }

    const pool = settings.currentPool;

    if (!pool.allowsReservation) {
      this.bot.queueUpdate(`Name pool ${pool.prettyName} does not allow reservation,`, nickname);
      return;
    }

    const user = await userRepository.preload({username});

    if (user && user.eligible) {
      const maybePick = await this.pickRepository.findOne({pool: pool, user: user});

      if (maybePick?.picked) {
        this.bot.queueUpdate(`Name already picked in the ${pool.prettyName} pool on ${moment(maybePick.pickedDate).format("YYYY-MM-DD")} for:`, nickname);
        return;
      }

      if (
        maybePick?.reserved &&
        ((maybePick.customName === customName) || (!maybePick.customName && !customName))
      ) {
        this.bot.queueUpdate(`Name already reserved in ${pool.prettyName} pool for:`, nickname);
        return;
      }

      const pick = maybePick ?? this.pickRepository.create({pool: pool, user: user});
      pick.reserved = true;
      pick.reservedDate = msg.timestamp;

      if (customName) {
        if (pool.validateName(customName)) {
          pick.customName = customName;
          await this.pickRepository.save(pick);
          this.bot.queueUpdate(`Custom name reserved in ${pool.prettyName} pool for:`, `${nickname} "${customName}"`);
        } else {
          this.bot.queueUpdate(`Invalid custom name by ${pool.prettyName} pool rules for:`, `${nickname} "${customName}"`);
          if (pool.validRemark) {
            this.bot.queueUpdate(`Name validity rules for ${pool.prettyName} pool:`, pool.validRemark);
          }
        }
      } else {
        if (pool.validateName(nickname)) {
          pick.customName = null;
          await this.pickRepository.save(pick);
          this.bot.queueUpdate(`Name reserved in ${pool.prettyName} pool for:`, nickname);
        } else {
          this.bot.queueUpdate(`Invalid name by ${pool.prettyName} pool rules, pick a custom name:`, nickname);
          if (pool.validRemark) {
            this.bot.queueUpdate(`Name validity rules for ${pool.prettyName} pool:`, pool.validRemark);
          }
        }
      }
    } else if (user && !user.eligible) {
      this.bot.queueUpdate("You are banned from the naming system,", nickname);
    }
  }
}
