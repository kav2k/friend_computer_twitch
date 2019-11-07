import * as moment from "moment";
import "reflect-metadata";
import TwitchJs, { BaseMessage } from "twitch-js";
import { PrivateMessage } from "twitch-js";
import { Brackets, createConnection, getRepository, Repository } from "typeorm";
import * as Config from "./config.json";
import { User } from "./db/entities/User";

const { api, chat, chatConstants } = new TwitchJs({ token: Config.token, username: Config.username });

// chat.on("PRIVMSG", (msg: PrivateMessage) => console.log(msg));
// chat.on("WHISPER", (msg: BaseMessage) => console.log(msg));

let userRepository: Repository<User>;

const ACTIVE_THRESHOLD = 15 * 60 * 1000; // 15 minutes

function parseCommand(msg: BaseMessage): [string?, string?] {
  if (msg.message) {
    const match = msg.message.match(/^!(\w+)(?:\s+(.+))?/);

    const [, command, args ] = match || [];

    if (command) {
      return [command, args];
    } else {
      return [];
    }
  } else {
    return [];
  }
}

function isElevated(msg: PrivateMessage): boolean {
  if (msg.tags.badges.broadcaster || msg.tags.badges.moderator) {
    return true;
  } else {
    return false;
  }
}

function pickRandom<T>(candidates: T[]): T | null {
  if (candidates.length) {
    const randIndex = Math.floor(candidates.length * Math.random());
    console.log(randIndex);
    return candidates[randIndex];
  } else {
    return null;
  }
}

async function markActive(msg: PrivateMessage): Promise<void> {
  // if (username === Config.broadcaster) { return; }

  const timestampMoment = moment(msg.timestamp);

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

async function onMessage(msg: PrivateMessage) {
  if (msg.channel === Config.channel) {
    const username = msg.username;
    const nickname = msg.tags.displayName || msg.username;

    await markActive(msg);

    const [command, args] = parseCommand(msg);

    if (command) {
      switch (command.toLowerCase()) {
        case "name":
          const namingUser = await userRepository.preload({username});

          if (namingUser && namingUser.eligible) {
            if (namingUser.picked) {
              queueUpdate("Name already picked for:", nickname);
              break;
            }

            if (
              namingUser.reserved &&
              ((namingUser.customName === args) || (!namingUser.customName && !args))
            ) {
              queueUpdate("Name already reserved for:", nickname);
            }

            if (args && args.length > 50) {
              queueUpdate("Custom name too long for:", nickname);
            } else if (args) {
              namingUser.reserved = true;
              namingUser.customName = args;
              userRepository.save(namingUser);
              queueUpdate("Custom name reserved for:", nickname);
            } else {
              namingUser.reserved = true;
              namingUser.customName = null;
              userRepository.save(namingUser);
              queueUpdate("Name reserved for:", nickname);
            }
          }
          break;
        case "unname":
          if (isElevated(msg) && args) {
            const clearingUser = await userRepository.preload({username: args.toLowerCase()});

            if (clearingUser && clearingUser.reserved) {
              clearingUser.reserved = false;
              clearingUser.customName = null;
              userRepository.save(clearingUser);
              // chat.say(Config.channel, `User ${args}'s name reservation removed`);
              queueUpdate("Name reservation cleared for:", args);
            } else {
              queueUpdate("No reservation found for:", args);
            }
          } else {
            const clearingUser = await userRepository.preload({username});

            if (clearingUser && clearingUser.reserved) {
              clearingUser.reserved = false;
              clearingUser.customName = null;
              userRepository.save(clearingUser);

              queueUpdate("Name reservation cleared for:", nickname);
            } else {
              queueUpdate("No reservation found for:", nickname);
            }
          }
          break;
        case "checkname":
          if (isElevated(msg) && args) {
            const pickedUser = await userRepository.preload({username: args.toLowerCase()});

            if (pickedUser) {
              if (pickedUser.picked) {
                queueUpdate("Name already picked for:", args);
              } else if (pickedUser.reserved && pickedUser.customName) {
                queueUpdate("Custom name reserved for:", `${args} "${pickedUser.customName}"`);
              } else if (pickedUser.reserved) {
                queueUpdate("Name reserved for:", args);
              } else if (pickedUser.eligible) {
                queueUpdate("Eligible to be picked if active:", args);
              } else {
                queueUpdate("Banned from name picking:", args);
              }
            } else {
              chat.say(Config.channel, `No data found for ${args}`);
            }
          } else {
            const pickedUser = await userRepository.preload({username});

            if (pickedUser) {
              if (pickedUser.picked) {
                queueUpdate("Name already picked for:", nickname);
              } else if (pickedUser.reserved && pickedUser.customName) {
                queueUpdate("Custom name reserved for:", `${nickname} "${pickedUser.customName}"`);
              } else if (pickedUser.reserved) {
                queueUpdate("Name reserved for:", nickname);
              } else if (pickedUser.eligible) {
                queueUpdate("Eligible to be picked if active:", nickname);
              } else {
                queueUpdate("Banned from name picking:", nickname);
              }
            }
          }

          break;
        case "clearpicks":
          if (isElevated(msg)) {
            // TODO
            // chat.say(Config.channel, `Picked users cleared`);
          }
          break;
        case "pick":
          if (isElevated(msg)) {
            const cutoff = moment(msg.timestamp).subtract(ACTIVE_THRESHOLD).toDate();

            const candidates = await userRepository
              .createQueryBuilder("user")
              .where("user.eligible")
              .andWhere("NOT user.picked")
              .andWhere(new Brackets((qb) => {
                qb.where("user.lastActive >= :cutoff", { cutoff })
                  .orWhere("user.reserved");
              }))
              .getMany();

            // const candidates = getActiveCandidates().filter((u) => !pickedUsers.has(u));
            console.log(candidates);
            const winner = pickRandom(candidates);
            console.log(winner);
            if (winner) {
              const name = winner.customName || winner.nickname;
              let reason = "";

              if (winner.reserved) {
                if (winner.customName) {
                  reason = `reserved name by ${winner.nickname}`;
                } else {
                  reason = "reserved name";
                }
              } else {
                reason = `active ${moment(winner.lastActive).fromNow()}`;
              }

              chat.say(Config.channel, `@${Config.broadcaster} Name picked: "${name}" (${reason})`);

              winner.picked = true;
              winner.pickedDate = msg.timestamp;
              winner.pickedRemark = "Picked randomly";

              await userRepository.save(winner);
            } else {
              chat.say(Config.channel, `No eligible candidates!`);
            }
          }
          break;
        case "unpick":
          if (isElevated(msg) && args) {
            const pickedUser = await userRepository.preload({username: args.toLowerCase()});

            if (pickedUser && pickedUser.picked) {
              pickedUser.picked = false;
              await userRepository.save(pickedUser);

              chat.say(Config.channel, `User ${args} was unpicked`);
            } else {
              chat.say(Config.channel, `User ${args} wasn't currently picked`);
            }
          }
          break;
        case "setpick":
          if (isElevated(msg) && args) {
            const pickedUser = await userRepository.preload({username: args});

            if (pickedUser) {
              if (pickedUser.picked) {
                chat.say(Config.channel, `User ${args} was already picked`);
              } else {
                pickedUser.picked = true;
                pickedUser.pickedDate = msg.timestamp;
                pickedUser.pickedRemark = "Picked manually";

                await userRepository.save(pickedUser);
                chat.say(Config.channel, `User ${args} manually set as picked`);
              }
            } else {
              await userRepository.save({
                username: args.toLowerCase(),
                nickname: args,
                picked: true,
                pickedDate: msg.timestamp,
                pickedRemark: "Picked manually"
              });
              chat.say(Config.channel, `User ${args} manually set as picked`);
            }
          }
          break;
        case "fakeactive":
          if (isElevated(msg) && args) {
            const pickedUser = await userRepository.preload({
              username: args.toLowerCase(),
              nickname: args,
              lastActive: msg.timestamp
            });

            if (pickedUser) {
              userRepository.save(pickedUser);
            } else {
              await userRepository.save({
                username: args.toLowerCase(),
                nickname: args,
                lastActive: msg.timestamp
              });
            }

            console.log(msg.channel, `Faked activity of user ${args}`);
          }
          break;
        case "fakename":
          if (isElevated(msg) && args) {
            // activeUsers.set(args, timestamp);
            // console.log(msg.channel, `Faked activity of user ${args}`);
          }
          break;
        case "purgename":
          if (isElevated(msg) && args) {
            // activeUsers.delete(args, timestamp);
            // console.log(msg.channel, `Faked activity of user ${args}`);
          }
          break;
        case "pickdebug":
          if (isElevated(msg)) {
            for (let i = 0; i < 60; i++) {
              queueUpdate("Printing a debug message for:", `testUser${i}`);
            }
            // console.log(await userRepository.createQueryBuilder().getMany());
          }
          break;
      }
    }
  }
}

const updates: Map<string, string[]> = new Map();
let queueInterval: NodeJS.Timeout | undefined;
const QUEUE_INTERVAL = 1000 * 3; // 3 seconds

async function queueUpdate(update: string, nickname: string) {
  let queue = updates.get(update);
  if (queue && !queue.includes(nickname)) {
    queue.push(nickname);
  } else {
    queue = [nickname];
  }
  updates.set(update, queue);

  if (!queueInterval) {
    queueInterval = setInterval(outputQueue, QUEUE_INTERVAL);
    setImmediate(outputQueue);
  }
}

async function outputQueue() {
  if (updates.size) {
    const [update, usernames]: [string, string[]] = updates.entries().next().value;
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
      chat.say(Config.channel, message);
    }

    const rest = usernames.slice(lastIndex);

    if (rest.length) {
      updates.set(update, rest);
    } else {
      updates.delete(update);
    }
  } else if (queueInterval) {
    clearInterval(queueInterval);
    queueInterval = undefined;
  }
}

chat.on("PRIVMSG", onMessage);

// function onWhisper(msg: BaseMessage) {
//   if (msg.message) {
//     const match = msg.message.match(/^!(\w+)(?:\s+(.+))?/);

//     const [, command, args ] = match || [];

//     if (command) {
//       console.log(`User ${msg.username} whispered command ${command}` + args ? ` with arguments "${args}"` : "");
//     }
//   }
// }

// chat.on("WHISPER", onWhisper);

chat.connect().then(async () => {
  await createConnection();
  userRepository = getRepository(User);
  await chat.join(Config.channel);
});
