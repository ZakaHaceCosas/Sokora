import { createCase } from "database/moderation";
import type { Channel, Guild, User } from "discord.js";
import { getModError } from "embeds/modEmbed";
import type { FeatureOutput } from "types";
import { errorToFeature } from "utils/errorType";
import { feature, type MethodParameters } from "utils/feature";

interface P {
  channel: Channel;
  moderator: User;
  guild: Guild;
  isSilent: boolean;
  reason: string;
}

interface O {
  title: string;
  reason: string | null;
}

async function method(...parameters: MethodParameters<P, O>): Promise<FeatureOutput<O>> {
  const [ok, fail, options] = parameters;
  const { channel, reason, guild, moderator } = options;

  const error = await getModError("ManageRoles", {
    channel,
    errorOptions: { allErrors: false, botError: true, channelError: true },
  });

  if (error) return fail(errorToFeature(error));

  if (channel.isThread() || channel.isDMBased())
    return fail({
      title: "You have provided a channel that can’t be locked.",
    });

  if (!channel.permissionsFor(guild.id)?.has("SendMessages"))
    return fail({
      title: "You can’t execute this command.",
      reason: "The channel is already locked.",
    });

  try {
    // TODO (for all features)
    // promise.all everywhere
    // createCase everywhere
    await Promise.all([
      channel.permissionOverwrites.create(guild.id, {
        SendMessages: false,
        SendMessagesInThreads: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
      }),
      createCase(guild, channel, "LOCK", moderator, reason),
    ]);

    return ok({ title: "Locked a channel", reason });
  } catch (error) {
    return fail(errorToFeature(error));
  }
}

export const lock = feature("mod/lock", method);
