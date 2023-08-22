const { SlashCommandBuilder } = require("discord.js");
const { error } = require("../../utils/log");
const { generateIDv2 } = require("../../utils/auth");

const command = new SlashCommandBuilder()
  .setName("feedback")
  .setDescription("Provide your feedback");

/**
 * @param {import("discord.js").Interaction} interaction
 */
async function execute(interaction) {
  // await interaction.reply({ content: "This command is a work in progress", ephemeral: true });
  try {
    const id = generateIDv2();
    await interaction.showModal({
      title: "Feedback",
      custom_id: `feedback-modal-${id}`,
      components: [{
        type: 1,
        components: [{
          type: 4,
          custom_id: "feedback",
          label: "Provide additional info",
          style: 2,
          min_length: 1,
          max_length: 4000,
          required: true
        }]
      }]
    });
  }
  catch (err) {
    error("Could not show modal");
    error(err.message);
  }
}

module.exports = {
  data: command,
  execute,
};
