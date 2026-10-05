import { createCase } from "database/moderation";
import type { Guild, User } from "discord.js";
import { getModError } from "embeds/modEmbed";
import type { FeatureOutput } from "types";
import { MILLISEC_28D } from "utils/constants";
import { errorToFeature } from "utils/errorType";
import { feature, type MethodParameters } from "utils/feature";
import { safeMember } from "utils/safeThings";

interface P {
  guild: Guild;
  durationMillisec: number;
  reason: string | null;
  moderator: User;
  target: User;
}

interface O {
  title: string;
  reason: string | null;
}

async function method(...parameters: MethodParameters<P, O>): Promise<FeatureOutput<O>> {
  const [ok, fail, options] = parameters;
  const { moderator, guild, target, durationMillisec, reason } = options;

  const error = await getModError("ModerateMembers", {
    target,
    action: "MUTE",
    errorOptions: { allErrors: true, botError: true, outsideError: true },
  });

  if (error) return fail(errorToFeature(error));

  if (durationMillisec > MILLISEC_28D || durationMillisec <= 0)
    return fail({
      title: `You can’t mute ${target.username}.`,
      reason: "The duration is invalid or is above the 28 day limit.",
    });

  if ((await safeMember(guild, target.id)).isCommunicationDisabled())
    return fail({
      title: `You can’t mute ${target.username}.`,
      reason: "The user is already muted.",
    });

  const time = new Date(
    Date.parse(new Date().toISOString()) + Date.parse(new Date(durationMillisec).toISOString()),
  ).toISOString();

  try {
    await (
      await safeMember(guild, target.id)
    )?.edit({ communicationDisabledUntil: time, reason: reason ?? undefined });
    await createCase(guild, target, "MUTE", moderator, reason);
    return ok({
      title: `Muted ${target.username}.`,
      reason,
    });
  } catch (error) {
    return fail(errorToFeature(error));
  }
}

export const mute = feature("mod/mute", method);
