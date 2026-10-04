import type { Channel } from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { hasModError, modEmbed } from "embeds/modEmbed";
import ms from "enhanced-ms";
import type { SafeChatInteraction } from "src/types";
import { MILLISEC_6H } from "utils/constants";

export async function slowdown(
  interaction: SafeChatInteraction,
  options: {
    timeMillisec: number;
    reason: string | null;
    channel: Channel;
    isSilent: boolean;
  },
) {
  const { timeMillisec, reason, channel, isSilent } = options;

  if (
    await hasModError("Manage Channels", {
      interaction,
      channel: channel.id,
      errorOptions: { allErrors: false, botError: true, channelError: true },
    })
  )
    return;

  if (timeMillisec > MILLISEC_6H)
    return await errorEmbed({
      interaction,
      title: "You have provided a duration longer than 6 hours.",
    });

  if (!channel.isTextBased() || channel.isDMBased())
    return await errorEmbed({
      interaction,
      title: "You have provided a channel that can’t be slowed down.",
    });

  await channel.setRateLimitPerUser(timeMillisec / 1000, reason ?? undefined);
  return await modEmbed({
    interaction,
    channel: channel.id,
    customText: {
      logTitle: timeMillisec
        ? `Set the slowdown to ${ms(timeMillisec, "fullPrecision")}`
        : "Removed the slowdown",
    },
    reason,
    isSilent,
  });
}
