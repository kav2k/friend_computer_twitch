import { PrivateMessage } from "twitch-js";
import { getRepository } from "typeorm";
import { Bot } from "../bot";
import { User } from "../db/entities/User";
import { ICommand, IParsedMessage } from "../interfaces";
import { parseMessage } from "../utils";

export abstract class BaseCommand implements ICommand {
  public abstract readonly name: string;

  protected bot: Bot;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  public abstract async run(msg: PrivateMessage): Promise<void>;

  protected get userRepository() {
    return getRepository(User);
  }

  protected parse(msg: PrivateMessage): IParsedMessage {
    return parseMessage(msg, this.bot.config.prefix);
  }
}
