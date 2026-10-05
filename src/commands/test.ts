import {
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { colorize, Sokolors } from "utils/colorize";
import { assertInteraction } from "types";

export const data = new SlashCommandBuilder()
  .setName("test")
  .setDescription("Run the Sokora test suite.")
  .setContexts(InteractionContextType.Guild);

export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  assertInteraction(interaction);

  await interaction.deferReply();

  const output = (await Bun.$`bun test`.nothrow()).stderr.toString();

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle("IRL test suite")
        .setDescription(
          "## test suite executed\ncheck attachment for output\n-# running on `bun:test` " +
            Bun.version_with_sha,
        )
        .setColor((await colorize({ hue: Sokolors.Yellow })) ?? null),
    ],
    files: [{ attachment: Buffer.from(output, "utf8"), name: "output.txt" }],
  });
}
