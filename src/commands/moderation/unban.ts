import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { unban } from "src/features/mod/unban";
import { assertInteraction } from "src/types";
import { shouldModerateSilently } from "utils/silent";

export const data = new SlashCommandSubcommandBuilder()
  .setName("unban")
  .setDescription("Unbans a user.")
  .addUserOption(user => {
    return user
      .setName("id")
      .setDescription("The ID of the user that you want to unban.")
      .setRequired(true);
  })
  .addStringOption(string => string.setName("reason").setDescription("The reason for the unban."));

export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  assertInteraction(interaction);

  const user = interaction.options.getUser("id", true);
  const reason = interaction.options.getString("reason");

  return await unban(interaction, {
    user,
    reason,
    isSilent: await shouldModerateSilently(interaction),
  });
}
