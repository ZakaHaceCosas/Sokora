import type { User } from "discord.js";
import { useErrorEmbed } from "embeds/errorEmbed";
import { hasModError, modEmbed } from "embeds/modEmbed";
import type { SafeChatInteraction } from "types";

export async function unban(
  interaction: SafeChatInteraction,
  options: {
    user: User;
    reason: string | null;
    isSilent: boolean;
  },
): Promise<void> {
  const { user, reason, isSilent } = options;

  if (
    await hasModError("Ban Members", {
      interaction,
      user,
      action: "Unban",
      errorOptions: { allErrors: false, botError: true, banCheckError: true },
    })
  )
    return;

  try {
    await interaction.guild?.members.unban(user.id, reason ?? undefined);
    return await modEmbed({
      interaction,
      user,
      action: "Unbanned",
      dbAction: "UNBAN",
      reason,
      isSilent,
    });
  } catch (error) {
    await useErrorEmbed({ interaction, error, fileName: "unban" });
  }
}
