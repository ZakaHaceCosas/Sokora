import type { Channel } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { hasModError, modEmbed } from "embeds/modEmbed";
import type { SafeChatInteraction } from "src/types";

export async function unlock(
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
      title: "You have provided a channel that can’t be locked in the first place.",
    });

  if (channel.permissionsFor(interaction.guild.id)?.has("SendMessages"))
    return await errorEmbed({
      interaction,
      title: "You can’t execute this command.",
      reason: "The channel is not locked.",
    });

  try {
    await channel.permissionOverwrites.create(interaction.guild.id, {
      SendMessages: null,
      SendMessagesInThreads: null,
      CreatePublicThreads: null,
      CreatePrivateThreads: null,
    });
    return await modEmbed({
      interaction,
      channel: channel.id,
      customText: { logTitle: "Unlocked a channel" },

      reason,
    });
  } catch (error) {
    await errorEmbed({ interaction, error, forward: true, fileName: "unlock" });
  }
}
