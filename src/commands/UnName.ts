import { PrivateMessage } from "twitch-js";
import { Pool } from "../db/entities/Pool";
import { BaseCommand } from "./BaseCommand";

export class UnNameCommand extends BaseCommand {
  public readonly name = "unname";

  public async run(msg: PrivateMessage): Promise<void> {
    const userRepository = this.userRepository;
    const settings = await this.bot.getSettings();

    let pool: Pool | null = null;

    const { username, nickname, arg, isElevated } = this.parse(msg);

    if (isElevated && arg) {
      const match = arg?.match(/^(\S+)\s+(\S+)$/);
      let targetUsername: string | undefined;
  
      if (match) {
        const poolName = match[1];
        pool = await this.poolRepository.findOneBy({name: poolName});
        if (!pool) {
          this.bot.say(`Pool "${poolName}" does not exist`);
          return;
        }
  
        targetUsername = match[2].toLowerCase();
      } else {
        if (settings.currentPool) {
          pool = settings.currentPool;
        } else {
          this.bot.say(`No pool is currently selected, can't remove reservation`);
          return;
        }
  
        targetUsername = arg.toLowerCase();
      }

      const user = await userRepository.preload({username: targetUsername.toLowerCase()});
      const maybePick = await this.pickRepository.findOneBy({user: {username: user?.username}, pool: {name: pool.name}});

      if (user && maybePick?.reserved) {
        maybePick.reserved = false;
        maybePick.customName = null;
        await this.pickRepository.save(maybePick);
        this.bot.queueUpdate(`Name reservation in the ${pool.prettyName} pool cleared for:`, targetUsername);
      } else {
        this.bot.queueUpdate(`No reservation found in the ${pool.prettyName} pool for:`, targetUsername);
      }
    } else {
      const user = await userRepository.preload({username});

      if (settings.currentPool) {
        pool = settings.currentPool;
      } else {
        this.bot.queueUpdate(`No pool is currently selected, can't remove reservation,`, username);
        return;
      }

      const maybePick = await this.pickRepository.findOneBy({user: {username: user?.username}, pool: {name: pool.name}});

      if (user && maybePick?.reserved) {
        maybePick.reserved = false;
        maybePick.customName = null;
        await this.pickRepository.save(maybePick);

        this.bot.queueUpdate(`Name reservation in the ${pool.prettyName} pool cleared for:`, nickname);
      } else {
        this.bot.queueUpdate(`No reservation found in the ${pool.prettyName} for:`, nickname);
      }
    }
  }
}
