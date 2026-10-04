import { listUserCases, removeCase } from "database/moderation";
import type { ContainerBuilder, User } from "discord.js";
import { buildErrorEmbed } from "embeds/errorEmbed";
import { hasModError, modEmbed } from "embeds/modEmbed";
import type { SafeChatInteraction } from "types";
import { mention } from "utils/mention";

interface Options {
  user: User;
  isSilent: boolean;
  warnId: number;
}

export async function delwarn(
  interaction: SafeChatInteraction,
  options: Options,
): Promise<ContainerBuilder> {
  const { isSilent, user, warnId } = options;

  if (
    await hasModError("Moderate Members", {
      interaction,
      user,
      action: "Remove a warning",
      errorOptions: { allErrors: true, botError: false },
    })
  )
    return;

  const warns = await listUserCases(interaction.guild.id, user.id, "WARN");
  const newWarns = warns.filter(warn => warn.id != warnId);

  if (newWarns.length == warns.length)
    return await buildErrorEmbed({
      interaction,
      title: `There is no warning with the id of ${warnId}.`,
    });

  try {
    await removeCase(interaction.guild.id, warnId);
  } catch (error) {
    return await useErrorEmbed({
      interaction,
      error,
      forward: true,
      fileName: "delwarn",
    });
  }

  return await modEmbed({
    interaction,
    user,
    shouldDm: true,
    customText: {
      logTitle: `Removed a warning from ${mention(user.id, "USER")}`,
      dmTitle: "Your warning has been removed",
    },
    isSilent,
  });
}
