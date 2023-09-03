// require internal modules
const fs = require("node:fs");
const path = require("node:path");

// require external modules
const {
  Client,
  Events,
  GatewayIntentBits: Intents,
  Collection,
  PermissionFlagsBits: Permissions,
} = require("discord.js");
const dotenv = require("dotenv");

const usernameLock = {};

// require local files
const { info, error, warn, initLogDatabase } = require("./utils/log");
const { initDatabase, db, Databases } = require("./utils/database");

// eslint-disable-next-line no-empty-function
function nop() { }

async function main() {
  process.env.THREAD_ID = 0;
  process.env.MACHINE_ID = 0;
  // parse .env
  const result = dotenv.config();

  if (result.error) {
    error("Could not read .env", true);
  }

  await initLogDatabase();
  await initDatabase();

  // init client
  const client = new Client({
    intents: [
      Intents.Guilds,
      Intents.MessageContent,
      Intents.GuildMessages,
      Intents.GuildMembers,
      Intents.GuildPresences,
    ],
  });

  client.commands = new Collection();


  const foldersPath = path.join(process.cwd(), "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {

    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);

      if (!("data" in command) || !("execute" in command)) {
        warn(`Missing \`data\` or \`execute\` in command ${file}`);
        continue;
      }
      client.commands.set(command.data.name, command);
    }
  }

  client.once(Events.ClientReady, c => {
    info(`Logged in as ${c.user.tag}`);
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isModalSubmit()) {
      console.log(interaction.customId);
    }
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      warn(`No command matching ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    }
    catch (err) {
      error("Some error happened when executing command " + err.message);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true });
      }
      else {
        await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
      }
    }
  });

  client.on(Events.MessageCreate, async msg => {
    if (!msg.channel.isTextBased()) return;
    const permissions = msg.channel.permissionsFor(client.user.id);
    if (!permissions) return;
    if (!permissions.has(Permissions.SendMessages)) return;

    // if (/^[23456789qp](\s*<.+>)?$/.test(msg.content)) {}
  });

  client.on(Events.GuildMemberUpdate, async (old, m) => {
    const id = m.id;
    const link = await db(Databases.StatusLink)
      .where("id0", id)
      .orWhere("id1", id)
      .orWhere("id2", id)
      .orWhere("id3", id)
      .orWhere("id4", id).first();

    if (usernameLock[link.id0]) return;
    if (usernameLock[link.id1]) return;
    if (usernameLock[link.id2]) return;
    if (usernameLock[link.id3]) return;
    if (usernameLock[link.id4]) return;

    usernameLock[link.id0] = true;
    usernameLock[link.id1] = true;
    usernameLock[link.id2] = true;
    usernameLock[link.id3] = true;
    usernameLock[link.id4] = true;

    if (!link) return;

    const m0 = link.id0 && link.id0 != id ? await m.guild.members.fetch(link.id0).catch(nop) : null;
    const m1 = link.id1 && link.id1 != id ? await m.guild.members.fetch(link.id1).catch(nop) : null;
    const m2 = link.id2 && link.id2 != id ? await m.guild.members.fetch(link.id2).catch(nop) : null;
    const m3 = link.id3 && link.id3 != id ? await m.guild.members.fetch(link.id3).catch(nop) : null;
    const m4 = link.id4 && link.id4 != id ? await m.guild.members.fetch(link.id4).catch(nop) : null;

    await m0?.setNickname(m.nickname);
    await m1?.setNickname(m.nickname);
    await m2?.setNickname(m.nickname);
    await m3?.setNickname(m.nickname);
    await m4?.setNickname(m.nickname);


    usernameLock[link.id0] = false;
    usernameLock[link.id1] = false;
    usernameLock[link.id2] = false;
    usernameLock[link.id3] = false;
    usernameLock[link.id4] = false;

  });

  try {
    // login to discord
    await client.login(process.env.DISCORD_TOKEN);
  }
  catch (err) {
    error("Could not log in", true);
  }
}

process.stdin.on("data", async buf => {
  try {
    console.log(eval(buf.toString("utf8")));
  } catch (err) {
    console.error(err);
  }
});

process.on("uncaughtException", err => {
  error("uncaughtException: " + err.message);
});

main();
