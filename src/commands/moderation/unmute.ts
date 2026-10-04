import { getSetting } from "database/settings";
import {
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
  type InteractionResponse,
  type Message,
} from "discord.js";
import { unmute } from "src/features/mod/unmute";
import { assertInteraction } from "src/types";
import { shouldModerateSilently } from "utils/silent";

export const data = new SlashCommandSubcommandBuilder()
  .setName("unmute")
  .setDescription("Unmutes a user.")
  .addUserOption(user =>
    user.setName("user").setDescription("The user that you want to unmute.").setRequired(true),
  )
  .addStringOption(reason =>
    reason.setName("reason").setDescription("The reason for unmuting the user."),
  )
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

  return await unmute(interaction, {
    user,
    reason,
    isSilent: await shouldModerateSilently(interaction),
  });
}
