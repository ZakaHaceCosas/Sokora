import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { modEmbed } from "embeds/modEmbed";
import { unlock } from "features/mod/unlock";
import { assertInteraction } from "types";
import { safeChannel } from "utils/safeThings";
import { shouldModerateSilently } from "utils/silent";

export const data = new SlashCommandSubcommandBuilder()
  .setName("unlock")
  .setDescription("Unlocks a channel.")
  .addStringOption(string =>
    string.setName("reason").setDescription("The reason for unlocking the chanel."),
  )
  .addChannelOption(channel => {
    return channel
      .setName("channel")
      .setDescription("The channel that you want to unlock.")
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
        ChannelType.GuildVoice,
        ChannelType.GuildStageVoice,
      );
  })
  .addBooleanOption(bool => {
    return bool
      .setName("silent")
      .setDescription(
        "If true, the message saying you unlocked the channel won’t be sent (overrides the server setting).",
      );
  });

export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  assertInteraction(interaction);

  const channelOption = interaction.options.getChannel("channel");
  const reason = interaction.options.getString("reason");
  let channel = await safeChannel(interaction.guild, interaction.channel.id);
  if (channelOption) channel = await safeChannel(interaction.guild, channelOption.id);

  const isSilent = await shouldModerateSilently(interaction);

  const result = await unlock({
    channel,
    reason,
    isSilent,
    guild: interaction.guild,
    moderator: interaction.user,
  });

  return result.success
    ? await modEmbed({ ...result.out, interaction })
    : await errorEmbed(result.reason === "exception", { interaction, ...result.out });
}
