import { createCase } from "database/moderation";
import type { Channel, Guild, User } from "discord.js";
import { getModError } from "embeds/modEmbed";
import type { FeatureOutput } from "types";
import { errorToFeature } from "utils/errorType";
import { feature, type MethodParameters } from "utils/feature";

interface P {
  guild: Guild;
  moderator: User;
  channel: Channel;
  reason: string | null;
}

interface O {
  title: string;
  reason: string | null;
}

async function method(...parameters: MethodParameters<P, O>): Promise<FeatureOutput<O>> {
  const [ok, fail, options] = parameters;
  const { guild, channel, moderator, reason } = options;

  const error = await getModError("ManageRoles", {
    channel,
    errorOptions: { allErrors: false, botError: true, channelError: true },
  });

  if (error) return fail(errorToFeature(error));

  if (channel.isThread() || channel.isDMBased())
    return fail({
      title: "You have provided a channel that can’t be locked in the first place.",
    });

  if (channel.permissionsFor(guild.id)?.has("SendMessages"))
    return fail({
      title: "You can’t execute this command.",
      reason: "The channel is not locked.",
    });

  try {
    await channel.permissionOverwrites.create(guild.id, {
      SendMessages: null,
      SendMessagesInThreads: null,
      CreatePublicThreads: null,
      CreatePrivateThreads: null,
    });
    await createCase(guild, channel, "UNLOCK", moderator, reason);
    return ok({
      title: "Unlocked channel.",
      reason,
    });
  } catch (error) {
    return fail(errorToFeature(error));
  }
}

export const unlock = feature("mod/unlock", method);
