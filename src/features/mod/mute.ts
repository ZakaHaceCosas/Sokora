import type { User } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { hasModError, modEmbed } from "embeds/modEmbed";
import type { SafeChatInteraction } from "src/types";
import { MILLISEC_28D } from "utils/constants";
import { safeMember } from "utils/safeThings";

export async function mute(
  interaction: SafeChatInteraction,
  options: {
    durationMillisec: number;
    reason: string | null;
    isSilent: boolean;
    user: User;
  },
) {
  const { isSilent, user, durationMillisec, reason } = options;

  if (
    await hasModError("Moderate Members", {
      interaction,
      user,
      action: "Mute",
      errorOptions: { allErrors: true, botError: true, outsideError: true },
    })
  )
    return;

  if (durationMillisec > MILLISEC_28D || durationMillisec <= 0)
    return await errorEmbed({
      interaction,
      title: `You can’t mute ${user.username}.`,
      reason: "The duration is invalid or is above the 28 day limit.",
    });

  if ((await safeMember(interaction.guild, user.id)).isCommunicationDisabled())
    return await errorEmbed({
      interaction,
      title: `You can’t mute ${user.username}.`,
      reason: "The user is already muted.",
    });

  const time = new Date(
    Date.parse(new Date().toISOString()) + Date.parse(new Date(durationMillisec).toISOString()),
  ).toISOString();

  try {
    await modEmbed({
      interaction,
      user,
      action: "Muted",
      duration: durationMillisec,
      shouldDm: true,
      dbAction: "MUTE",
      expiresAt: new Date(durationMillisec),
      isSilent,
      reason,
    });
    await (
      await safeMember(interaction.guild, user.id)
    )?.edit({ communicationDisabledUntil: time, reason: reason ?? undefined });
  } catch (error) {
    await errorEmbed({ interaction, error, forward: true, fileName: "mute" });
  }
}
