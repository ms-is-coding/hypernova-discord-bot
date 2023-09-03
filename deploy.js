const dotenv = require("dotenv");
const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { warn, info, error } = require("./utils/log");

async function main() {
  const result = dotenv.config();

  if (result.error) {
    error("Could not read .env", true);
  }

  const commands = [];
  const foldersPath = path.join(process.cwd(), "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {

    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if (!("data" in command) && !("execute" in command)) {
        warn(`Missing \`data\` or \`execute\` in command ${file}`);
        continue;
      }
      commands.push(command.data.toJSON());
    }
  }


  try {
    info(`Started refreshing ${commands.length} application commands.`);

    if (process.env.NODE_ENV == "production") {

      info("Running in production mode");
      const rest = new REST().setToken(process.env.PROD_DISCORD_TOKEN);
      const data = await rest.put(
        Routes.applicationCommands(process.env.PROD_CLIENT_ID),
        { body: commands },
      );
      info(`Reloaded ${data.length} application commands`);

    }
    else {

      const rest = new REST().setToken(process.env.DISCORD_TOKEN);
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands },
      );
      info(`Reloaded ${data.length} application commands.`);

    }

  }
  catch (err) {
    // And of course, make sure you catch and log any errors!
    error(err);
  }
}

main();
