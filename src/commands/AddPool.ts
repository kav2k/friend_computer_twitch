import { PrivateMessage } from "twitch-js";
import { BaseCommand } from "./BaseCommand";
import { getRepository } from "typeorm";
import { Pool, PoolType } from "../db/entities/Pool";

export class AddPoolCommand extends BaseCommand {
  public readonly name = "addpool";

  public async run(msg: PrivateMessage): Promise<void> {
    const poolRepository = this.poolRepository;
    let poolName : string;
    let poolType : PoolType;

    const { arg, isElevated } = this.parse(msg);

    if (isElevated) {
      const match = arg?.match(/^(\S+)\s+(\S+)$/);

      if (match && Object.values(PoolType).includes(match[2] as PoolType)) {
        poolName = match[1];
        poolType = match[2] as PoolType;
      } else {
        this.bot.say(`Can't parse "${arg}"`);
        return;
      }

      const pool = await poolRepository.preload({name: poolName});

      if (pool) {
        this.bot.say(`Pool ${poolName} already exists`);
      } else {
        await poolRepository.save({
          name: poolName,
          type: poolType
        });
        this.bot.say(`Pool ${poolName} created`);
      }
    }
  }
}
