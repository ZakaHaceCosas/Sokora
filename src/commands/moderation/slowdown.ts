import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
  type InteractionResponse,
  type Message,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import ms from "enhanced-ms";
import { slowdown } from "src/features/mod/slowdown";
import { assertInteraction } from "src/types";
import { safeChannel } from "utils/safeThings";
import { shouldModerateSilently } from "utils/silent";

export const data = new SlashCommandSubcommandBuilder()
  .setName("slowdown")
  .setDescription("Slows a channel down.")
  .addStringOption(string => {
    return string
      .setName("time")
      .setDescription(
        "Time to slow the channel down to (e.g 30m, 2h, max - 6h). 0 for no slowdown.",
      )
      .setRequired(true);
  })
  .addStringOption(string =>
    string.setName("reason").setDescription("The reason for the slowdown."),
  )
  .addChannelOption(channel => {
    return channel
      .setName("channel")
      .setDescription("The channel that you want to slowdown.")
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
        ChannelType.GuildVoice,
        ChannelType.GuildStageVoice,
      );
  })
  .addBooleanOption(bool => {
    return bool
      .setName("silent")
      .setDescription(
        "If true, the user won’t be notified about this action (overrides the server setting).",
      );
  });

export async function run(
  interaction: ChatInputCommandInteraction,
): Promise<Message | InteractionResponse | undefined> {
  assertInteraction(interaction);

  const channelOption = interaction.options.getChannel("channel");
  let channel = await safeChannel(interaction.guild, interaction.channel.id);
  if (channelOption) channel = await safeChannel(interaction.guild, channelOption.id);

  const time = interaction.options.getString("time");
  if (!time)
    return await errorEmbed({
      interaction,
      title: "No time provided.",
      reason:
        "You somehow ran the command without a time value being provided. That is an error. You might want to report this, as it is not supposed to ever happen.",
    });

  const timeMillisec = ms(time) ?? 0;
  const reason = interaction.options.getString("reason");

  return await slowdown(interaction, {
    timeMillisec,
    reason,
    channel,
    isSilent: await shouldModerateSilently(interaction),
  });
}
