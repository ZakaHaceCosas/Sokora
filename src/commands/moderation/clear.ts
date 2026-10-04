import {
  ChannelType,
  SlashCommandSubcommandBuilder,
  type ChatInputCommandInteraction,
  type InteractionResponse,
  type Message,
} from "discord.js";
import { errorEmbed } from "embeds/errorEmbed";
import { clear } from "src/features/mod/clear";
import { assertInteraction } from "src/types";
import { safeChannel } from "utils/safeThings";

export const data = new SlashCommandSubcommandBuilder()
  .setName("clear")
  .setDescription("Clears messages.")
  .addNumberOption(number => {
    return number
      .setName("amount")
      .setDescription("The amount of messages that you want to clear (maximum is 100).")
      .setRequired(true);
  })
  .addChannelOption(channel => {
    return channel
      .setName("channel")
      .setDescription("The channel that has the messages that you want to clear.")
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
        ChannelType.GuildVoice,
        ChannelType.GuildStageVoice,
      );
  })
  .addUserOption(user =>
    user.setName("user").setDescription("Only clear messages from this specific user."),
  );

export async function run(
  interaction: ChatInputCommandInteraction,
): Promise<Message | InteractionResponse | undefined> {
  assertInteraction(interaction);

  const channelOption = interaction.options.getChannel("channel");
  let channel = await safeChannel(interaction.guild, interaction.channel.id);
  if (channelOption) channel = await safeChannel(interaction.guild, channelOption.id);

  const amount = interaction.options.getNumber("amount");
  if (!amount)
    return await errorEmbed({
      interaction,
      title: "No amount provided.",
      reason:
        "You somehow ran the command without an amount being provided. That is an error. You might want to report this, as it is not supposed to ever happen.",
    });

  const targetUser = interaction.options.getUser("user") ?? undefined;
  if (!channel.isTextBased() || channel.isDMBased())
    return await errorEmbed({
      interaction,
      title: "You have provided a channel that can’t have messages to clear.",
    });

  return await clear(interaction, {
    targetUser,
    amount,
    channel,
  });
}
