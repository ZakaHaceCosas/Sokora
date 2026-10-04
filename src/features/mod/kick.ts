import type { User } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { hasModError, modEmbed } from "embeds/modEmbed";
import { safeMember } from "utils/safeThings";
import type { SafeChatInteraction } from "types";

export async function kick(
  interaction: SafeChatInteraction,
  options: {
    user: User;
    reason: string | null;
    isSilent: boolean;
  },
) {
  const { isSilent, user, reason } = options;

  if (
    await hasModError("Kick Members", {
      interaction,
      user,
      action: "Kick",
      errorOptions: { allErrors: true, botError: true, outsideError: true },
    })
  )
    return;

  try {
    await (await safeMember(interaction.guild, user.id)).kick(reason ?? undefined);
    return await modEmbed({
      interaction,
      user,
      action: "Kicked",
      shouldDm: true,
      dbAction: "KICK",
      isSilent,
      reason,
    });
  } catch (error) {
    return await errorEmbed({ interaction, error, forward: true, fileName: "kick" });
  }
}
