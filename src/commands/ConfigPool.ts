import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";
import { getRepository } from "typeorm";
import { Pool, PoolType } from "../db/entities/Pool";

export class ConfigPoolCommand extends BaseCommand {
  public readonly name = "configpool";

  public async run(msg: PrivateMessage): Promise<void> {
    const poolRepository = this.poolRepository;

    const { arg, isElevated } = this.parse(msg);

    if (isElevated) {
      const match = arg?.match(/^(\S+)\s+(\S+)\s+(.*)$/);

      if (match) {
        const poolName = match[1];
        const settingKey = match[2];
        const settingValue = match[3];

        const pool = await poolRepository.findOne({name: poolName});

        if (pool) {
            switch(settingKey) {
                case "type":
                    if (Object.values(PoolType).includes(settingValue as PoolType)) {
                        pool.type = settingValue as PoolType;
                        this.bot.say(`Set pool ${poolName} pool type to "${settingValue}"`);
                    } else {
                        this.bot.say(`Unrecognized pool type ${settingValue}`);
                        return;
                    }
                    break;
                case "displayName":
                    pool.displayName = settingValue;
                    this.bot.say(`Set pool ${poolName} display name to "${settingValue}"`);
                    break;
                case "validRegex":
                    try {
                        new RegExp(settingValue);
                        pool.validRegex = settingValue;
                        this.bot.say(`Set pool ${poolName} validity regex to "${settingValue}"`);
                    } catch (e) {
                        this.bot.say(`Value "${settingValue} rejected as a RegExp`);
                    }
                    break;
                case "validRemark":
                    pool.validRemark = settingValue;
                    this.bot.say(`Set pool ${poolName} validity remark to "${settingValue}"`);
                    break;
                default:
                    this.bot.say(`Unrecognized setting key ${settingKey}`);
                    return;
            }
            await poolRepository.save(pool);
            await this.bot.refreshSettings();
        } else {
            this.bot.say(`Pool ${poolName} doesn't exist`);
        }
      } else {
        this.bot.say(`Can't parse "${arg}", should be "poolName key value"`);
      }
    }
  }
}
