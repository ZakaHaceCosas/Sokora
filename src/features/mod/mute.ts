import { createCase } from "database/moderation";
import type { Guild, User } from "discord.js";
import { getModError } from "embeds/modEmbed";
import type { FeatureOutput } from "types";
import { MILLISEC_28D } from "utils/constants";
import { errorToFeature } from "utils/errorType";
import { safeMember } from "utils/safeThings";

export async function mute(options: {
  guild: Guild;
  durationMillisec: number;
  reason: string | null;
  moderator: User;
  target: User;
}): Promise<
  FeatureOutput<{
    title: string;
    reason: string | null;
  }>
> {
  const { moderator, guild, target, durationMillisec, reason } = options;

  const error = await getModError("ModerateMembers", {
    target,
    action: "MUTE",
    errorOptions: { allErrors: true, botError: true, outsideError: true },
  });

  if (error) return errorToFeature("mod/mute", error);

  if (durationMillisec > MILLISEC_28D || durationMillisec <= 0)
    return {
      title: `You can’t mute ${target.username}.`,
      reason: "The duration is invalid or is above the 28 day limit.",
    };

  if ((await safeMember(guild, target.id)).isCommunicationDisabled())
    return {
      title: `You can’t mute ${target.username}.`,
      reason: "The user is already muted.",
    };

  const time = new Date(
    Date.parse(new Date().toISOString()) + Date.parse(new Date(durationMillisec).toISOString()),
  ).toISOString();

  try {
    await (
      await safeMember(guild, target.id)
    )?.edit({ communicationDisabledUntil: time, reason: reason ?? undefined });
    await createCase(guild.id, target.id, "MUTE", moderator.id, reason);
  } catch (error) {
    return errorToFeature("mod/mute", error);
  }
}
