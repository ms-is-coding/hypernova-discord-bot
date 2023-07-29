const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { TriHex } = require("../../utils/trihex");
const sharp = require("sharp");
const { error } = require("../../utils/log");

const command = new SlashCommandBuilder();
command.setName("trihex");
command.setDescription("TriHex Code commands");
command.addSubcommand(subcommand => {
	subcommand.setName("generate");
	subcommand.setDescription("Generates a TriHex Code");
	subcommand.addStringOption(option => {
		option.setName("data");
		option.setDescription("The data to encode");
		option.setRequired(true);
		return option;
	});
	subcommand.addStringOption(option => {
		option.setName("type");
		option.setDescription("The type of the data");
		option.setChoices(
			{ name: "Alpha - letters a-z and spaces (converted to lowercase)", value: "Alpha" },
			{ name: "Numeric - numbers 0-9 and spaces", value: "Numeric" },
			{ name: "AlphaNumeric - letters a-z, A-Z, numbers 0-9 and spaces", value: "AlphaNumeric" },
			{ name: "ASCII - all symbols available on an english keyboard", value: "Ascii" },
			{ name: "Hexadecimal - symbols 0-9, a-f", value: "Hex" },
			{ name: "Base32 - RFC 4648 base32 (no padding).", value: "Base32" },
			{ name: "Base64 - RFC 4648 base64 / base64url (no padding).", value: "Base64" },
			{ name: "UTF-8 - can represent most of the characters (also takes up more space)", value: "Utf8" },
		);
		return option;
	});
	return subcommand;
});

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
	await interaction.deferReply();
	const data = interaction.options.get("data").value;
	const type = interaction.options.get("type", false)?.value;
	const ok = TriHex.validate(data, type);
	const valid = TriHex.filter(data, type);

	if (!ok) {
		await interaction.editReply({ ephemeral: true, content: `The \`type\` you provided cannot represent the \`data\`\nYour input will appear like this: \`\`\`${valid}\`\`\`` });
	}
	// await interaction.followUp({ ephemeral: false });

	try {
		const svg = TriHex(data, {
			type: type,
			color: "#777777"
		});
		const image = await sharp(Buffer.from(svg, "utf8")).png().toBuffer();
		await interaction.editReply({
			body: {
				attachments: ["attachment://image.png"]
			},
			files: [
				new AttachmentBuilder().setName("image.png").setFile(image)
			]
		});
	}
	catch (err) {
		error(`${err.name}: ${err.message}\n${err.stack}`);
	}
}

module.exports = {
	data: command,
	execute,
};
