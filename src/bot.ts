import moment from "moment";
import * as PM2 from "pm2";
import TwitchJs, { Api, Chat, PrivateMessage, PrivateMessages } from "twitch-js";
import { Connection, createConnection, getRepository } from "typeorm";
import { User } from "./db/entities/User";
import { Settings } from "./db/entities/Settings";
import { Pick } from "./db/entities/Pick";
import { IAuthResponse, ICommand, IConfig } from "./interfaces";
import { isPrivateMessage, parseMessage } from "./utils";
import axios from "axios";
import { saveConfig } from "./config";

export const ACTIVE_THRESHOLD = 15 * 60 * 1000; // 15 minutes

const QUEUE_INTERVAL = 1000 * 3; // 3 seconds

export class Bot {
  public readonly api: Api;
  public readonly chat: Chat;
  public readonly config: IConfig;

  private readonly tjs: TwitchJs;
  private connection?: Connection;
  private commands: Map<string, ICommand>;

  private settings?: Settings;
  
  public lastPick?: Pick;

  private updates: Map<string, string[]>;
  private queueInterval?: NodeJS.Timeout;

  constructor(config: IConfig) {
    this.config = config;

    this.tjs = new TwitchJs({
      token: this.config.token,
      username: this.config.username,
      clientId: this.config.client_id,
      onAuthenticationFailure: this.onAuthFailure.bind(this),
      // log: { level: "warn" }
    });

    this.api = this.tjs.api;
    this.chat = this.tjs.chat;

    this.commands = new Map();
    this.updates = new Map();

    this.chat.on("PRIVMSG", this.onMessage.bind(this));

    // Make sure this is attempted on every connect
    this.chat.on("CONNECTED", () => this.chat.join(this.config.channel));
  }

  private async onAuthFailure(): Promise<string> {
    console.log("onAuthFailure: Refreshing token");

    console.log(this.config);

    try {
      const response = await axios.request<IAuthResponse>(
        {
          method: "POST",
          url: "https://id.twitch.tv/oauth2/token",
          params: {
            grant_type: "refresh_token",
            refresh_token: this.config.refresh_token,
            client_id: this.config.client_id,
            client_secret: this.config.client_secret
          },
          responseType: "json"
        }
      )

      this.config.token = "oauth:" + response.data.access_token;
      this.config.refresh_token = response.data.refresh_token;
      
      if (this.config.refresh_token) {
        await saveConfig(this.config);
      }

      console.log(`onAuthFailure: New token ${this.config.token}`);

      return this.config.token;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async connect() {
    await this.chat.connect();
    this.connection = await createConnection();
  }

  public async getSettings(): Promise<Settings> {
    // If the Settings object is already cached, return it
    if (this.settings) {
      console.log("Cached settings:", this.settings);
      return this.settings;
    }

    // Else, try to load it - first one in the table, it's supposed to be a singleton
    const settingsRepository = getRepository(Settings);
    let settings = await settingsRepository.findOne({});

    if (settings) {
      // We found existing settings - use them
      this.settings = settings;
      return settings;
    } else {
      // Create default settings and save them
      settings = settingsRepository.create();
      await settingsRepository.save(settings);
      return settings;
    }
  }

  public async refreshSettings(): Promise<void> {
    // Force-load settings from the DB

    const settingsRepository = getRepository(Settings);
    let settings = await settingsRepository.findOne({});

    if (settings) {
      // We found existing settings - use them
      this.settings = settings;
    } else {
      // Create default settings and save them
      settings = settingsRepository.create();
      await settingsRepository.save(settings);
    }
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

  private async onMessage(msg: PrivateMessages): Promise<void> {
    if (!isPrivateMessage(msg)) return;

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
    const pickRepository = getRepository(Pick);

    const username = msg.username;
    const nickname = msg.tags.displayName || msg.username;
    const id = msg.tags.userId;

    let user: User | null = null;

    if (id) {
      user = await userRepository.findOneBy({id});
    }

    if (user) {
      if (user.username !== username) {
        // We've got a user with the same id but different username - user was renamed
        // Will try to find by old username
        const oldUser = user;
        let newUser: User;

        const userByName = await userRepository.findOneBy({username});
        if (userByName) {
          // Had a user with that username already; just update the ID, leave other data intact
          userByName.id = oldUser.id;
          newUser = userByName;
        } else {
          // User updated their username to something not previously known
          // Create a new user (since primary key changed)
          newUser = userRepository.create({...user, username, id, nickname});
        }
        await userRepository.save(newUser);

        // Update all pick records to use the new user
        const oldPicks = await pickRepository.find({where: {user: {username: oldUser.username}}});
        const updatedPicks = oldPicks.map(pick => { pick.user = newUser; return pick; });
        await pickRepository.save(updatedPicks);

        user = newUser;
        await userRepository.remove(oldUser);
      }
      // Gotta update their capitalization just in case
      user.nickname = nickname;
    } else {
      // There was no user with that ID; preload in case there's a user with that username
      user = await userRepository.preload({username, id, nickname}) ?? null;
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
