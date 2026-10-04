import type {
  NewsChannel,
  PrivateThreadChannel,
  PublicThreadChannel,
  StageChannel,
  TextChannel,
  User,
  VoiceChannel,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { hasModError, modEmbed } from "embeds/modEmbed";
import type { SafeChatInteraction } from "src/types";
import { mention } from "utils/mention";
import { pluralOrNot } from "utils/pluralOrNot";

export async function clear(
  interaction: SafeChatInteraction,
  options: {
    channel:
      | NewsChannel
      | StageChannel
      | TextChannel
      | PublicThreadChannel
      | PrivateThreadChannel
      | VoiceChannel;
    amount: number;
    targetUser: User | undefined;
  },
) {
  const { channel, amount, targetUser } = options;

  if (
    await hasModError("Manage Messages", {
      interaction,
      channel: channel?.id,
      errorOptions: { allErrors: false, botError: true, channelError: true },
    })
  )
    return;

  if (amount > 100)
    return await errorEmbed({
      interaction,
      title: "You can only clear up to 100 messages at a time.",
    });

  if (amount < 1)
    return await errorEmbed({ interaction, title: "You must clear at least 1 message." });

  if (!channel.isTextBased() || channel.isDMBased())
    return await errorEmbed({
      interaction,
      title: "You have provided a channel that can’t have messages to clear.",
    });

  let deletedAmount = 0;

  try {
    if (targetUser) {
      const userMessages = (await channel.messages.fetch({ limit: 100 }))
        .filter(m => m.author.id == targetUser.id && !m.partial)
        .first(amount);

      if (userMessages.length === 0)
        return await errorEmbed({
          interaction,
          title: "No messages found.",
          reason: "No messages from this user were found in the recent history.",
        });

      await channel.bulkDelete(userMessages, true);
      deletedAmount = userMessages.length;
    } else {
      await channel.bulkDelete(amount, true).then(messages => (deletedAmount = messages.size));

      if (deletedAmount == 0)
        return await errorEmbed({
          interaction,
          title: "No messages found.",
          reason: "No messages were found in the recent history.",
        });
    }
  } catch (error) {
    return await errorEmbed({
      interaction,
      error,
      forward: true,
      fileName: "clear",
    });
  }

  await modEmbed({
    interaction,
    user: targetUser,
    channel: channel.id,
    customText: {
      logTitle: `Cleared ${deletedAmount} ${pluralOrNot("message", deletedAmount)}${targetUser ? ` from ${mention(targetUser.id, "USER")}` : ""}`,
    },
  });
}
