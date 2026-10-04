import { SlashCommandSubcommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { rps } from "features/games/rps";
import { assertInteraction } from "types";

export const data = new SlashCommandSubcommandBuilder()
  .setName("rps")
  .setDescription("Play rock paper scissors.")
  .addUserOption(option => option.setName("opponent").setDescription("The user to play against."));

export async function run(interaction: ChatInputCommandInteraction): Promise<void> {
  assertInteraction(interaction);

  const opponent = interaction.options.getUser("opponent") ?? interaction.client.user;
  const player = interaction.user;

  return await rps(interaction, {
    opponent,
    player,
  });
}
