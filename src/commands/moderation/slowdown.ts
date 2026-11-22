import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { modEmbed } from "embeds/modEmbed";
import ms from "enhanced-ms";
import { slowdown } from "features/mod/slowdown";
import { assertInteraction } from "types";
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
        "If true, the message saying you slowed the channel won’t be visible (overrides the server setting).",
      );
  });

export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  assertInteraction(interaction);

  const channelOption = interaction.options.getChannel("channel");
  let channel = await safeChannel(interaction.guild, interaction.channel.id);
  if (channelOption) channel = await safeChannel(interaction.guild, channelOption.id);

  const time = interaction.options.getString("time", true);

  const timeMillisec = ms(time) ?? 0;
  const reason = interaction.options.getString("reason");

  const isSilent = await shouldModerateSilently(interaction);

  const result = await slowdown({
    timeMillisec,
    isSilent,
    reason,
    channel,
    moderator: interaction.user,
    guild: interaction.guild,
  });

  return result.success
    ? await modEmbed({ ...result.out, interaction })
    : await errorEmbed(result.reason === "exception", { interaction, ...result.out });
}
