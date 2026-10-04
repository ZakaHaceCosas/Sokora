import { createCase } from "database/moderation";
import type { Channel, Guild, User } from "discord.js";
import { getModError } from "embeds/modEmbed";
import type { FeatureOutput } from "types";
import { errorToFeature } from "utils/errorType";

export async function unlock(options: {
  guild: Guild;
  moderator: User;
  channel: Channel;
  reason: string | null;
}): Promise<
  FeatureOutput<{
    title: string;
    reason: string | null;
  }>
> {
  const { guild, channel, moderator, reason } = options;

  const error = await getModError("ManageRoles", {
    channel,
    errorOptions: { allErrors: false, botError: true, channelError: true },
  });

  if (error) return errorToFeature(error);

  if (channel.isThread() || channel.isDMBased())
    return {
      success: false,
      feature: "mod/unlock",
      out: {
        title: "You have provided a channel that can’t be locked in the first place.",
      },
    };

  if (channel.permissionsFor(guild.id)?.has("SendMessages"))
    return {
      success: false,
      feature: "mod/unlock",
      out: {
        title: "You can’t execute this command.",
        reason: "The channel is not locked.",
      },
    };

  try {
    await channel.permissionOverwrites.create(guild.id, {
      SendMessages: null,
      SendMessagesInThreads: null,
      CreatePublicThreads: null,
      CreatePrivateThreads: null,
    });
    // TODO:
    // channel.id makes no sense because this is called user_id
    // AND as far as I know (i might be wrong) HAS BEEN AS SUCH SINCE BEFORE I TOUCHED ANYTHING
    // potentially menas production cases system is wrong
    await createCase(guild.id, channel.id, "UNLOCK", moderator.id, reason);
    return {
      success: true,
      feature: "mod/unlock",
      out: {
        title: "Unlocked channel.",
        reason,
      },
    };
  } catch (error) {
    return errorToFeature("mod/unlock", error);
  }
}
