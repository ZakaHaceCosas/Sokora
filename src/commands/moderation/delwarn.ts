import {
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
  type InteractionResponse,
  type Message,
} from "discord.js";
import { useErrorEmbed } from "embeds/errorEmbed";
import { delwarn } from "features/mod/delwarn";
import { assertInteraction } from "types";
import { shouldModerateSilently } from "utils/silent";

export const data = new SlashCommandSubcommandBuilder()
  .setName("delwarn")
  .setDescription("Removes a warning from a user.")
  .addUserOption(user => {
    return user
      .setName("user")
      .setDescription("The user that you want to free from the warning.")
      .setRequired(true);
  })
  .addNumberOption(number =>
    number.setName("id").setDescription("The id of the warn.").setRequired(true),
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

  const user = interaction.options.getUser("user");
  const warnId = interaction.options.getNumber("id");

  if (!user)
    return await useErrorEmbed({
      interaction,
      title: "No user provided.",
      reason:
        "You somehow ran the command without a user being provided. That is an error. You might want to report this, as it is not supposed to ever happen.",
    });

  if (!warnId)
    return await useErrorEmbed({
      interaction,
      title: "No ID provided.",
      reason:
        "You somehow ran the command without an ID being provided. That is an error. You might want to report this, as it is not supposed to ever happen.",
    });

  // TODO: make this as in other places
  return await delwarn(interaction, {
    user,
    warnId,
    isSilent: await shouldModerateSilently(interaction),
  });
}
