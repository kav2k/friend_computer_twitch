import { PrivateMessage } from "twitch-js";
import { getRepository } from "typeorm";
import { Bot } from "../bot";
import { User } from "../db/entities/User";
import { ICommand, IParsedMessage } from "../interfaces";
import { parseMessage } from "../utils";
import { Pool } from "../db/entities/Pool";
import { Pick } from "../db/entities/Pick";

export abstract class BaseCommand implements ICommand {
  public abstract readonly name: string;

  protected bot: Bot;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  public abstract run(msg: PrivateMessage): Promise<void>;

  protected get userRepository() {
    return getRepository(User);
  }

  protected get poolRepository() {
    return getRepository(Pool);
  }

  protected get pickRepository() {
    return getRepository(Pick);
  }

  protected parse(msg: PrivateMessage): IParsedMessage {
    return parseMessage(msg, this.bot.config.prefix);
  }
}
