import type { Channel } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { hasModError, modEmbed } from "embeds/modEmbed";
import type { SafeChatInteraction } from "types";

export async function lock(
  interaction: SafeChatInteraction,
  options: {
    channel: Channel;
    reason: string | null;
  },
) {
  const { channel, reason } = options;

  if (
    await hasModError("Manage Roles", {
      interaction,
      channel: channel.id,
      errorOptions: { allErrors: false, botError: true, channelError: true },
    })
  )
    return;

  if (channel.isThread() || channel.isDMBased())
    return await errorEmbed({
      interaction,
      title: "You have provided a channel that can’t be locked.",
    });

  if (!channel.permissionsFor(interaction.guild.id)?.has("SendMessages"))
    return await errorEmbed({
      interaction,
      title: "You can’t execute this command.",
      reason: "The channel is already locked.",
    });

  try {
    await Promise.all([
      channel.permissionOverwrites.create(interaction.guild.id, {
        SendMessages: false,
        SendMessagesInThreads: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
      }),
      modEmbed({
        interaction,
        channel: channel.id,
        customText: { logTitle: "Locked a channel" },
        reason,
      }),
    ]);
  } catch (error) {
    return await errorEmbed({
      interaction,
      error,
      forward: true,
      fileName: "lock",
    });
  }
}
