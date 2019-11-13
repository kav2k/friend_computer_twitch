import "reflect-metadata";
import { Bot } from "./bot";
import * as Commands from "./commands";
import * as Config from "./config.json";

const bot = new Bot(Config);

async function main() {
    for (const ModuleConstructor of Object.values(Commands)) {
        bot.addPMCommand(new ModuleConstructor(bot));
    }

    await bot.connect();
}

process.on("SIGINT", async () => {
    bot.terminate("Interrupt signal");
});

process.once("SIGTERM", async () => {
    bot.terminate("Termination signal");
});

main();
