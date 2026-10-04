import type { User } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { hasModError, modEmbed } from "embeds/modEmbed";
import type { SafeChatInteraction } from "src/types";
import { safeMember } from "utils/safeThings";

export async function unmute(
  interaction: SafeChatInteraction,
  options: {
    reason: string | null;
    isSilent: boolean;
    user: User;
  },
) {
  const { isSilent, user, reason } = options;
  const target = await safeMember(interaction.guild, user.id);

  if (
    await hasModError("Moderate Members", {
      interaction,
      user,
      action: "Unmute",
      errorOptions: { allErrors: false, botError: true, outsideError: true },
    })
  )
    return;

  if (!target?.isCommunicationDisabled())
    return await errorEmbed({
      interaction,
      title: "You can’t unmute this user.",
      reason: "The user was never muted.",
    });

  try {
    await target?.edit({ communicationDisabledUntil: null });
    return await modEmbed({
      interaction,
      user,
      action: "Unmuted",
      shouldDm: true,
      dbAction: "UNMUTE",
      isSilent,
      reason,
    });
  } catch (error) {
    await errorEmbed({ interaction, error, forward: true, fileName: "unmute" });
  }
}
