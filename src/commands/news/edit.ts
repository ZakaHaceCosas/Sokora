import { getNews, updateNews } from "database/news";
import { getSetting } from "database/settings";
import {
  ContainerBuilder,
  SlashCommandSubcommandBuilder,
  TextDisplayBuilder,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import { newsEmbed } from "embeds/newsEmbed";
import { colorize, Sokolors } from "utils/colorize";
import { newsModal } from "utils/newsModal";
import { replaceVariables } from "utils/replace";
import { safeChannel, safeMember } from "utils/safeThings";
import { sendChannelNews } from "utils/sendChannelNews";
import { assertInteraction } from "types";
import { buildErrorEmbed, useErrorEmbed } from "embeds/errorEmbed";

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
  const user = interaction.user;
  assertInteraction(interaction);
  if (!(await safeMember(interaction.guild, user.id)).permissions.has("ManageGuild")) {
    await interaction.reply({
      components: [
        (
          await buildErrorEmbed({
            title: "You can’t execute this command.",
            reason: "You need the **Manage Server** permission.",
          })
        )[0],
      ],
      flags: ["Ephemeral", "IsComponentsV2"],
    });
    return;
  }

  const id = interaction.options.getNumber("id", true);

  const guild = interaction.guild;
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

    const title = await replaceVariables(
      modalInteraction.fields.getTextInputValue("title"),
      guild,
      user,
    );

    const body = await replaceVariables(
      modalInteraction.fields.getTextInputValue("body"),
      guild,
      user,
    );

    const editedContainer = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("## News post edited."))
      .setAccentColor(await colorize({ hue: Sokolors.Green }));

    if (!(await getSetting(interaction.guild.id, "news", "edit_original_message"))) {
      await sendChannelNews(
        interaction.guild,
        interaction,
        { title, body, author_id: news.author_id, id },
        true,
      );
      return await modalInteraction.reply({
        components: [editedContainer],
        flags: ["Ephemeral", "IsComponentsV2"],
      });
    }

    const channel = (await safeChannel(
      interaction.guild,
      (await getSetting(interaction.guild.id, "news", "channel")) ?? interaction.channel.id,
    )) as TextChannel;

    await Promise.all([
      channel.messages.edit(news.message_id, {
        components: [
          await newsEmbed(interaction.guild, { title, body, author_id: news.author_id, id }, true),
        ],
        flags: "IsComponentsV2",
      }),
      updateNews(interaction.guild.id, id, title, body),
      modalInteraction.reply({
        components: [editedContainer],
        flags: ["Ephemeral", "IsComponentsV2"],
      }),
    ]);
  });
}
