import { getLatestNews } from "database/news";
import { getSetting } from "database/settings";
import {
  ContainerBuilder,
  SlashCommandSubcommandBuilder,
  TextDisplayBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { colorize, Sokolors } from "utils/colorize";
import { dekominator } from "utils/kominator";
import { newsModal } from "utils/newsModal";
import { replaceVariables } from "utils/replace";
import { safeMember } from "utils/safeThings";
import { sendChannelNews } from "utils/sendChannelNews";
import { assertInteraction } from "types";
import { buildErrorEmbed, useErrorEmbed } from "embeds/errorEmbed";

export const data = new SlashCommandSubcommandBuilder()
  .setName("post")
  .setDescription("Post your news.");

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

  const guild = interaction.guild;
  try {
    await interaction.showModal(await newsModal(null, guild));
  } catch (error) {
    return await useErrorEmbed({ interaction, error, fileName: "post" });
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

    try {
      const media = modalInteraction.fields.getUploadedFiles("images");
      await sendChannelNews(guild, interaction, {
        title,
        body,
        author_id: modalInteraction.user.id,
        image_url: media
          ? dekominator(
              media
                .filter(item => {
                  return (
                    item.contentType &&
                    (item.contentType.startsWith("image/") || item.contentType.startsWith("video/"))
                  );
                })
                .map(image => image.url)
                .toReversed(),
            )
          : undefined,
        id: ((await getLatestNews(guild.id))[0]?.id ?? 0) + 1,
        category_id:
          (await getSetting(guild.id, "news", "categories")).length > 0
            ? modalInteraction.fields.getStringSelectValues("category")[0]
            : undefined,
      });
    } catch (error) {
      return await useErrorEmbed({ interaction, error, fileName: "post" });
    }

    await modalInteraction.reply({
      components: [
        new ContainerBuilder()
          .addTextDisplayComponents(new TextDisplayBuilder().setContent("## News post created."))
          .setAccentColor(await colorize({ hue: Sokolors.Green })),
      ],
      flags: ["Ephemeral", "IsComponentsV2"],
    });
  });
}
