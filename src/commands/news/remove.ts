import { deleteNews, getNews } from "database/news";
import { getSetting } from "database/settings";
import {
  ContainerBuilder,
  SlashCommandSubcommandBuilder,
  TextDisplayBuilder,
  type ChatInputCommandInteraction,
  type InteractionResponse,
  type Message,
  type TextChannel,
} from "discord.js";
import { buildErrorEmbed } from "embeds/errorEmbed";
import { colorize, Sokolors } from "utils/colorize";
import { safeChannel, safeMember } from "utils/safeThings";
import { assertInteraction } from "types";

export const data = new SlashCommandSubcommandBuilder()
  .setName("remove")
  .setDescription("Removes a news post.")
  .addNumberOption(number => {
    return number
      .setName("id")
      .setDescription("The ID of the news post. (found in the footer)")
      .setRequired(true);
  });

export async function run(
  interaction: ChatInputCommandInteraction,
): Promise<Message | InteractionResponse | undefined> {
  assertInteraction(interaction);
  if (!(await safeMember(interaction.guild, interaction.user.id)).permissions.has("ManageGuild")) {
    await interaction.reply({
      components: [
        (
          await buildErrorEmbed({
            interaction,
            title: "You can’t execute this command.",
            reason: "You need the **Manage Server** permission.",
          })
        )[0],
      ],
      flags: ["IsComponentsV2", "Ephemeral"],
    });

    return;
  }

  const id = interaction.options.getNumber("id", true);

  const news = await getNews(interaction.guild.id, id);
  if (!news) {
    await interaction.reply({
      components: [
        (
          await buildErrorEmbed({ interaction, title: "The specified news post doesn’t exist." })
        )[0],
      ],
      flags: ["IsComponentsV2", "Ephemeral"],
    });
    return;
  }

  const newsChannel = (await safeChannel(
    interaction.guild,
    (await getSetting(interaction.guild.id, "news", "channel")) ?? interaction.channel.id,
  )) as TextChannel;

  if (newsChannel && news.message_id) await newsChannel.messages.delete(news.message_id);
  await deleteNews(interaction.guild.id, id);
  await interaction.reply({
    components: [
      new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("## News post removed."))
        .setAccentColor(await colorize({ hue: Sokolors.Green })),
    ],
    flags: ["Ephemeral", "IsComponentsV2"],
  });
}
