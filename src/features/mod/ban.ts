import { client } from "botfile";
import { createCase } from "database/moderation";
import type { Guild, User } from "discord.js";
import { getModError } from "embeds/modEmbed";
import type { FeatureOutput } from "types";
import { errorToFeature } from "utils/errorType";
import { feature, type MethodParameters } from "utils/feature";
import { safeMembers } from "utils/safeThings";
import { scheduleUnban } from "utils/unbanScheduler";

// TODO: (for all P too)
// i removed isSilent bc i thought of keeping it view-sided, but only now i remembered that logging is controller-sided
// so yeah i should re-add it (whenever i actually add logging to features, which is not now somehow)
interface P {
  guild: Guild;
  /** Moderator who bans. */
  moderator: User;
  /** Banned user. */
  target: User;
  /** Duration of the ban in millisec. Leave empty for non-expiring bans. */
  durationMillisec: number | undefined;
  /** Reason of the ban. */
  reason: string | null;
  /** Time-frame to delete messages from in **seconds**, not millisec. */
  delMessageSeconds: number | undefined;
}

// TODO: (for all O too)
// make it return all data needed for a modEmbed, even if user provided already
interface O {
  title: string;
  reason: string | null;
}

async function method(...parameters: MethodParameters<P, O>): Promise<FeatureOutput<O>> {
  const [ok, fail, options] = parameters;
  const { guild, target, moderator, durationMillisec, reason, delMessageSeconds } = options;

  const isMember = (await safeMembers(guild)).has(target.id);

  const error = await getModError("BanMembers", {
    target,
    action: "BAN",
    errorOptions: {
      allErrors: isMember,
      banCheckError: true,
      botError: true,
    },
  });

  if (error) return fail(errorToFeature(error));

  try {
    await guild.members.ban(target.id, {
      reason: reason ?? undefined,
      deleteMessageSeconds: delMessageSeconds,
    });

    const caseId = await createCase(guild.id, target.id, "BAN", moderator.id, reason);

    if (durationMillisec)
      scheduleUnban(client, guild, target.id, moderator.id, durationMillisec, caseId);

    return ok({
      /* success: true,
      target,
      guild,
      moderator,
      caseId,
      action: "BAN",
      duration: durationMillisec ?? undefined,
      shouldDm: isMember,
      expiresAt: durationMillisec ? new Date(durationMillisec) : undefined,
      isSilent,
      reason, */
      title: "Banned user.", // not even a good title i know, WILL CHANGE
      reason: reason ?? null,
    });
  } catch (error) {
    return fail(errorToFeature(error));
  }
}

export const ban = feature("mod/ban", method);
