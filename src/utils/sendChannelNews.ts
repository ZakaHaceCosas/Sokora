import { postNews, updateNews } from "database/news";
import { getSetting } from "database/settings";
import type { ChatInputCommandInteraction, Guild, TextChannel } from "discord.js";
import { newsEmbed } from "embeds/newsEmbed";
import { channelCheck } from "./channelCheck";
import { safeChannel } from "./safeThings";
import { assertInteraction } from "types";

/**
 * Sends news to a channel.
 * @param {Guild} guild Guild where the channel is in.
 * @param {ChatInputCommandInteraction} interaction Command interaction.
 * @param {object} newsOptions Options to send the news post.
 * @param {?boolean} willEdit Whether or not should the function make a new message with some reused elements.
 * @returns News message in a channel.
 */
export async function sendChannelNews(
  guild: Guild,
  interaction: ChatInputCommandInteraction,
  newsOptions: {
    title: string;
    body: string;
    author_id: string;
    id: number;
    image_url?: string;
    category_id?: string;
  },
  willEdit?: boolean,
): Promise<void> {
  const { title, body, author_id, id, image_url, category_id } = newsOptions;
  assertInteraction(interaction);

  const category = await getSetting(guild.id, "news", "categories", category_id);
  const channel = (await safeChannel(
    guild,
    category.channel ?? (await getSetting(guild.id, "news", "channel")) ?? interaction.channel.id,
  )) as TextChannel;

  if (
    !(await channelCheck({
      channel,
      guild,
      permType: "Send",
      setting: { category: "news", setting: "channel" },
    }))
  )
    return;

  const message = await channel.send({
    components: [
      await newsEmbed(guild, {
        title,
        body,
        author_id,
        id,
        image_url,
        categoryRoles: category.roles,
      }),
    ],
    flags: "IsComponentsV2",
  });
  if (willEdit) {
    await updateNews(guild.id, id, title, body, message.id);
    return;
  }

  await postNews(guild.id, title, body, author_id, message.id, image_url, id, category_id);
}
