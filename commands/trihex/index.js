const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { TriHex, filter, validate, DataError } = require("../../utils/trihex");
const sharp = require("sharp");
const { error, db } = require("../../utils/log");

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
      { name: "AlphaNumeric - letters a-z, A-Z, numbers 0-9 and spaces", value: "AlphaNum" },
      { name: "ASCII - all symbols available on an english keyboard", value: "Ascii" },
      { name: "Hexadecimal - symbols 0-9, a-f", value: "Hex" },
      { name: "Base32 - RFC 4648 base32 (no padding).", value: "Base32" },
      { name: "Base64 - RFC 4648 base64 / base64url (no padding).", value: "Base64" },
      { name: "UTF-8 - can represent most of the characters (also takes up more space)", value: "Utf8" },
    );
    return option;
  });
  subcommand.addStringOption(option => {
    option.setName("color");
    option.setDescription("The hex color of the triangles");
    return option;
  });
  subcommand.addStringOption(option => {
    option.setName("background");
    option.setDescription("Replace transparency with a solid background (hex)");
    return option;
  });
  return subcommand;
});

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
  await interaction.deferReply({ ephemeral: false });
  const data = interaction.options.get("data").value;
  const type = interaction.options.get("type", false)?.value;
  const color = interaction.options.get("color", false)?.value;
  const background = interaction.options.get("background", false)?.value;

  if (color && !/^#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})$/.test(color)) {
    await interaction.editReply("The `color` option is invalid");
    return;
  }

  if (background && !/^#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})$/.test(background)) {
    await interaction.editReply("The `background` option is invalid");
    return;
  }

  if (!validate(data, type)) {
    const valid = filter(data, type);
    await interaction.editReply(`The \`type\` you provided cannot represent the \`data\`\nYour input will appear like this: \`\`\`${valid}\`\`\``);
  }

  db("trihex").insert({ user_id: interaction.user.id, data });

  try {
    const svg = TriHex(data, {
      type, color, background
    });
    const image = await sharp(Buffer.from(svg, "utf8")).png().toBuffer();
    await interaction.editReply({
      body: { attachments: ["attachment://image.png"] },
      files: [new AttachmentBuilder().setName("image.png").setFile(image)]
    });
  }
  catch (err) {
    if (!(err instanceof DataError)) return;
    if (err.type == "Overflow") {
      await interaction.editReply("The data you provided is too big.\nConsider using another encoding or a smaller dataset.");
    }
    else if (err.type == "NoEncoding") {
      await interaction.editReply("Data cannot be properly encoded");
    }
    error(err.stack);
  }
}

module.exports = {
  data: command,
  execute,
};
