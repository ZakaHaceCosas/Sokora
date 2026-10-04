import { createCase } from "database/moderation";
import type { Channel, Guild, User } from "discord.js";
import { getModError } from "embeds/modEmbed";
import ms from "enhanced-ms";
import type { FeatureOutput } from "types";
import { MILLISEC_6H } from "utils/constants";
import { errorToFeature } from "utils/errorType";
import { feature, type MethodParameters } from "utils/feature";

interface P {
  guild: Guild;
  moderator: User;
  timeMillisec: number;
  reason: string | null;
  channel: Channel;
}

interface O {
  title: string;
  reason: string | null;
}

async function work(...parameters: MethodParameters<P, O>): Promise<FeatureOutput<O>> {
  const [ok, fail, options] = parameters;
  const { timeMillisec, reason, channel, guild, moderator } = options;

  const error = await getModError("ManageChannels", {
    channel,
    errorOptions: { allErrors: false, botError: true, channelError: true },
  });

  if (error) return fail(errorToFeature(error));

  if (timeMillisec > MILLISEC_6H)
    return fail({
      title: "You have provided a duration longer than 6 hours.",
    });

  if (!channel.isTextBased() || channel.isDMBased())
    return fail({
      title: "You have provided a channel that can’t be slowed down.",
    });

  await channel.setRateLimitPerUser(timeMillisec / 1000, reason ?? undefined);
  await createCase(guild.id, channel.id, "SLOWDOWN", moderator.id, reason);

  return ok({
    title: timeMillisec
      ? `Set the slowdown to ${ms(timeMillisec, "fullPrecision")}`
      : "Removed the slowdown",
    reason,
  });
}

export const slowdown = feature("mod/slowdown", work);
