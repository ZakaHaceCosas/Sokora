import {
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
  type InteractionResponse,
  type Message,
} from "discord.js";
import { assertInteraction } from "types";
import { shouldModerateSilently } from "utils/silent";
import { kick } from "src/features/mod/kick";

export const data = new SlashCommandSubcommandBuilder()
  .setName("kick")
  .setDescription("Kicks a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to kick.").setRequired(true),
  )
  .addStringOption(string => string.setName("reason").setDescription("The reason for the kick."))
  .addBooleanOption(bool => {
    return bool
      .setName("silent")
      .setDescription(
        "If true, the user won’t be notified about this action (overrides the server setting).",
      );
  });

export async function run(
  interaction: ChatInputCommandInteraction,
): Promise<Message | InteractionResponse | undefined> {
  assertInteraction(interaction);

  const user = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason");
  const isSilent = await shouldModerateSilently(interaction);

  return await kick(interaction, {
    user,
    isSilent,
    reason,
  });
}
