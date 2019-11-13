import * as moment from "moment";
import * as PM2 from "pm2";
import TwitchJs, { Api, Chat, PrivateMessage } from "twitch-js";
import { Connection, createConnection, getRepository } from "typeorm";
import { User } from "./db/entities/User";
import { ICommand, IConfig } from "./interfaces";
import { parseMessage } from "./utils";

export const ACTIVE_THRESHOLD = 15 * 60 * 1000; // 15 minutes

const QUEUE_INTERVAL = 1000 * 3; // 3 seconds

export class Bot {
  public readonly api: Api;
  public readonly chat: Chat;
  public readonly config: IConfig;

  private readonly tjs: TwitchJs;
  private connection?: Connection;
  private commands: Map<string, ICommand>;

  private updates: Map<string, string[]>;
  private queueInterval?: NodeJS.Timeout;

  constructor(config: IConfig) {
    this.config = config;

    this.tjs = new TwitchJs({ token: this.config.token, username: this.config.username });

    this.api = this.tjs.api;
    this.chat = this.tjs.chat;

    this.commands = new Map();
    this.updates = new Map();

    this.chat.on("PRIVMSG", this.onMessage.bind(this));
  }

  public async connect() {
    await this.chat.connect();
    this.connection = await createConnection();
    await this.chat.join(this.config.channel);
  }

  public async terminate(reason: string, stayDead: boolean = false) {
    console.log(`Terminating for ${ stayDead ? "shutdown" : "restart" } (${reason})`);

    if (this.queueInterval) {
      clearInterval(this.queueInterval);
      this.queueInterval = undefined;
    }

    await this.connection?.close();

    if (stayDead) {
      PM2.stop("friend_computer_twitch", () => {
        process.exit();
      });
    } else {
      process.exit();
    }
  }

  public addPMCommand(command: ICommand) {
    this.commands.set(command.name, command);
  }

  public async queueUpdate(update: string, nickname: string) {
    let queue = this.updates.get(update);
    if (queue && !queue.includes(nickname)) {
      queue.push(nickname);
    } else {
      queue = [nickname];
    }
    this.updates.set(update, queue);

    if (!this.queueInterval) {
      this.queueInterval = setInterval(this.outputQueue.bind(this), QUEUE_INTERVAL);
      setImmediate(this.outputQueue.bind(this));
    }
  }

  public async say(message: string): Promise<void> {
    await this.chat.say(this.config.channel, message);
  }

  private async onMessage(msg: PrivateMessage): Promise<void> {
    if (msg.channel !== this.config.channel) {
      return;
    }

    await this.markActive(msg);

    const {commandName} = parseMessage(msg, this.config.prefix);

    if (commandName) {
      const command = this.commands.get(commandName);

      await command?.run(msg);
    }
  }

  private async outputQueue(): Promise<void> {
    if (this.updates.size) {
      const [update, usernames]: [string, string[]] = this.updates.entries().next().value;
      let lastIndex = 0;
      let message = update;

      for (const [index, username] of usernames.entries()) {
        if (Buffer.byteLength(`${message} ${username}`, "utf-8") > 500) {
          lastIndex = index;
          break;
        } else {
          lastIndex = index + 1;
          message = `${message} ${username}`;
        }
      }

      if (lastIndex) {
        this.chat.say(this.config.channel, message);
      }

      const rest = usernames.slice(lastIndex);

      if (rest.length) {
        this.updates.set(update, rest);
      } else {
        this.updates.delete(update);
      }
    } else if (this.queueInterval) {
      clearInterval(this.queueInterval);
      this.queueInterval = undefined;
    }
  }

  private async markActive(msg: PrivateMessage): Promise<void> {
    const timestampMoment = moment(msg.timestamp);
    const userRepository = getRepository(User);

    const username = msg.username;
    const nickname = msg.tags.displayName || msg.username;
    const id = msg.tags.userId;

    let user: User | undefined;

    if (id) {
      user = await userRepository.findOne({id});
    }

    if (user) {
      if (user.username !== username) {
        // We've got a user with the same id but different username - user was renamed
        // Will try to find by old username
        const userByName = await userRepository.findOne({username});
        if (userByName) {
          // Had a user with that username already; just update the ID, leave other data intact
          userByName.id = user.id;
          await userRepository.remove(user);
          user = userByName;
        } else {
          // User updated their username to something not previously known
          await userRepository.remove(user);
          user = userRepository.create({username, id, nickname});
        }
      }
      // Gotta update their capitalization just in case
      user.nickname = nickname;
    } else {
      // There was no user with that ID; preload in case there's a user with that username
      user = await userRepository.preload({username, id, nickname});
    }

    if (user) {
      // User with that username is found (or created) above
      if (user.lastActive) {
        const lastTimestamp = moment(user.lastActive);
        if (timestampMoment.diff(lastTimestamp) > ACTIVE_THRESHOLD) {
          console.log(`Refreshing user ${username} as active`);
        }
      } else {
        console.log(`Setting user ${username} as active`);
      }
      user.lastActive = timestampMoment.toDate();
    } else {
      // We still don't have a user with that username
      user = userRepository.create({
        username,
        nickname,
        id,
        lastActive: timestampMoment.toDate()
      });
      console.log(`Setting user ${username} as active`);
    }
    await userRepository.save(user);
  }
}
