// require internal modules
const fs = require("node:fs");
const path = require("node:path");

// require external modules
const { Client, Events, GatewayIntentBits: Intents, Collection } = require("discord.js");
const dotenv = require("dotenv");

// require local files
const { info, error, warn } = require("./utils/log");

// eslint-disable-next-line no-empty-function
function nop() {}

async function main() {
	// parse .env
	const result = dotenv.config();

	if (result.error) {
		error("Could not read .env", true);
	}

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
			error("Some error happened when executing command");

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true });
			}
			else {
				await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
			}
		}
	});

	client.on(Events.MessageCreate, async msg => {
		if (/^[23456789qp](\s*<.+>)?$/.test(msg.content)) {

			const x = await msg.guild.members.fetch("700811761972150374").catch(nop);
			const y = await msg.guild.members.fetch("964842927635451904").catch(nop);

			if (x && x.presence?.status != "offline") return;
			if (y && y?.presence?.status != "offline") return;

			await msg.reply("hey there!").catch(err => error(`${err.name} ${err.message}`));

		}
	});

	process.on("beforeExit", () => exit(client));
	process.on("SIGTERM", () => exit(client));
	process.on("SIGINT", () => exit(client));
	process.on()

	try {
		// login to discord
		await client.login(process.env.DISCORD_TOKEN);
	}
	catch (err) {
		error("Could not log in", true);
	}
}

async function exit(client) {
	console.log("Exiting");
	try {
		const channel = await client.channels.fetch("995268417261162559");
		await channel.send("Bot going offline");
	} catch (err) {
		console.log("Bot already offline");
		console.error(err);
	}
}


main();
