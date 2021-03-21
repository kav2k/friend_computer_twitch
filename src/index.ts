import "reflect-metadata";
import { Bot } from "./bot";
import * as Commands from "./commands";
import { loadConfig } from "./config";

async function main() {
    const bot = new Bot(await loadConfig());

    for (const ModuleConstructor of Object.values(Commands)) {
        bot.addPMCommand(new ModuleConstructor(bot));
    }

    process.on("SIGINT", async () => {
        bot.terminate("Interrupt signal");
    });
    
    process.once("SIGTERM", async () => {
        bot.terminate("Termination signal");
    });    

    await bot.connect();
}

main();
