import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";
import { getRepository } from "typeorm";
import { Settings } from "../db/entities/Settings";

export class UsePoolCommand extends BaseCommand {
  public readonly name = "usepool";

  public async run(msg: PrivateMessage): Promise<void> {
    const poolRepository = this.poolRepository;

    const { arg, isElevated } = this.parse(msg);

    if (isElevated) {
      const match = arg?.match(/^(\S+)$/);

      if (match) {
        const poolName = match[1];

        if (poolName == "none") {
          const settings = await this.bot.getSettings();
          settings.currentPool = null;
          await getRepository(Settings).save(settings);
          this.bot.say(`Current name pool unset`);
          return;
        }

        const pool = await poolRepository.findOneBy({name: poolName});

        if (pool) {
          const settings = await this.bot.getSettings();
          settings.currentPool = pool;
          await getRepository(Settings).save(settings);
          this.bot.say(`Current name pool set to ${pool.prettyName}`);
        } else {
          this.bot.say(`Pool ${poolName} doesn't exist`);
        }
      } else {
        this.bot.say(`Can't parse "${arg}", should be "poolName"`);
      }
    }
  }
}
