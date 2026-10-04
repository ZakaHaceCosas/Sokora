import type { User } from "discord.js";
import { hasModError, modEmbed } from "embeds/modEmbed";
import type { FeatureOutput, SafeChatInteraction } from "types";

export async function warn(
  interaction: SafeChatInteraction,
  options: {
    reason: string | null;
    isSilent: boolean;
    user: User;
  },
) {
  const { reason, isSilent, user } = options;

  if (
    !interaction.guild ||
    (await hasModError("ModerateMembers", {
      interaction,
      user,
      action: "Warn",
      errorOptions: { allErrors: true, botError: false, outsideError: true },
    }))
  )
    return;

  await modEmbed({
    interaction,
    user,
    action: "Warned",
    shouldDm: true,
    dbAction: "WARN",
    isSilent,
    reason,
  });
}
