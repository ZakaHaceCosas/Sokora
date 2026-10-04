import { createCase } from "database/moderation";
import type { User } from "discord.js";
import { buildModEmbed, getModError } from "embeds/modEmbed";
import type { FeatureOutput, SafeChatInteraction } from "types";
import {  exceptionToFeatureErrorOut,  } from "utils/errorType";
import { safeMembers } from "utils/safeThings";
import { scheduleUnban } from "utils/unbanScheduler";

export async function ban(
  interaction: SafeChatInteraction,
  options: {
    /** Moderator who bans. */
    moderator: User;
    /** Banned user. */
    target: User;
    /** Duration of the ban in millisec. Leave empty for non-expiring bans. */
    durationMillisec: number | undefined;
    /** Reason of the ban. */
    reason: string | undefined;
    /** Time-frame to delete messages from in **seconds**, not millisec. */
    delMessageSeconds: number | undefined;
    isSilent: boolean;
  },
  // TODO: make it agnostic and return a result type
): Promise<
  FeatureOutput<true>
> {
  const { target, moderator, durationMillisec, reason, delMessageSeconds, isSilent } = options;

  const isMember = (await safeMembers(interaction.guild)).has(target.id);

    const error = await getModError("BanMembers", {
      interaction,
      target,
      action: "BAN",
      errorOptions: {
        allErrors: isMember,
        banCheckError: true,
        botError: true,
      },
    })

  if (error) return {
    success: false,
    out: error
  };

  try {
        await interaction.guild.members.ban(target.id, {
          reason,
          deleteMessageSeconds: delMessageSeconds,
        });

    const caseId = await createCase(interaction.guild.id, target.id, "BAN", moderator.id)

    await buildModEmbed({
      // TODO: was i drunk writing this? if it doesn’t succeed you use errorEmbed
      success: true,
      target,
      guild: interaction.guild,
      moderator,
      caseId,
      action: "BAN",
      duration: durationMillisec ?? undefined,
      shouldDm: isMember,
      expiresAt: durationMillisec ? new Date(durationMillisec) : undefined,
      isSilent,
      reason,
    });

    if (durationMillisec)
      scheduleUnban(
        interaction.client,
        interaction.guild,
        target.id,
        moderator.id,
        durationMillisec,
        caseId,
      );
  } catch (error) {
    return {
      success: false,
      feature: "mod/ban",
      out: exceptionToFeatureErrorOut(error)
    };
  }
}
