const { SlashCommandBuilder } = require("discord.js");

const command = new SlashCommandBuilder()
	.setName("config")
	.setDescription("Modify your preferences");

/**
 * @param {import("discord.js").Interaction} interaction
 */
async function execute(interaction) {
	await interaction.reply({ content: "This command is a work in progress", ephemeral: true });
}

module.exports = {
	data: command,
	execute,
};
