import { getNews, updateNews } from "database/news";
import {
  ChannelType,
  ContainerBuilder,
  SlashCommandSubcommandBuilder,
  TextDisplayBuilder,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import { newsEmbed } from "embeds/newsEmbed";
import { colorize, Sokolors } from "utils/colorize";
import { newsModal } from "utils/newsModal";
import {  safeMember } from "utils/safeThings";
import { assertInteraction } from "types";
import { buildErrorEmbed, useErrorEmbed } from "embeds/errorEmbed";
import { edit } from "features/news/edit";

export const data = new SlashCommandSubcommandBuilder()
  .setName("edit")
  .setDescription("Edits a news post.")
  .addNumberOption(number => {
    return number
      .setName("id")
      .setDescription("The ID of the news post that you want to edit.")
      .setRequired(true);
  });

export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  assertInteraction(interaction);

  const id = interaction.options.getNumber("id", true);
  const user = await safeMember(interaction.guild, interaction.user.id);
  const guild = interaction.guild;
  // TODO: duplicate within the feature?
  const news = await getNews(guild.id, id);
  if (!news) {
    await interaction.reply({
      components: [(await buildErrorEmbed({ title: "The specified news post doesn’t exist." }))[0]],
      flags: ["Ephemeral", "IsComponentsV2"],
    });
    return;
  }

  try {
    await interaction.showModal(await newsModal(news));
  } catch (error) {
    return await useErrorEmbed({ interaction, error, fileName: "edit" });
  }

  interaction.client.once("interactionCreate", async modalInteraction => {
    if (!modalInteraction.isModalSubmit()) return;

    const rawTitle = modalInteraction.fields.getTextInputValue("title");
    const rawBody = modalInteraction.fields.getTextInputValue("body");

    if (
      !interaction.channel.isTextBased() ||
      interaction.channel.isVoiceBased() ||
      interaction.channel.isDMBased() ||
      interaction.channel.isThread() ||
      interaction.channel.type == ChannelType.GuildAnnouncement
    )
      return;

    const result = await edit({
      userMember: user,
      rawBody, rawTitle, guild, id, fallbackChannel: interaction.channel
    })

    if (!result.success) {
      await interaction.reply({
        components: [(await buildErrorEmbed({ interaction, ...result.out }))[0]],
        flags: ["IsComponentsV2", "Ephemeral"],
      });
      return;
    }

    const editedContainer = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("## News post edited."))
      .setAccentColor(await colorize({ hue: Sokolors.Green }));
    modalInteraction.reply({
      components: [editedContainer],
      flags: ["Ephemeral", "IsComponentsV2"],
    })
  }
}
