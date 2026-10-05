import { createCase } from "database/moderation";
import type { Guild, User } from "discord.js";
import { getModError } from "embeds/modEmbed";
import type { FeatureOutput } from "types";
import { errorToFeature } from "utils/errorType";
import { feature, type MethodParameters } from "utils/feature";

interface P {
  guild: Guild;
  moderator: User;
  target: User;
  reason: string | null;
}

interface O {
  title: string;
  reason: string | null;
}

async function method(...parameters: MethodParameters<P, O>): Promise<FeatureOutput<O>> {
  const [ok, fail, options] = parameters;
  const { target, reason, guild, moderator } = options;

  const error = await getModError("BanMembers", {
    target,
    action: "UNBAN",
    errorOptions: { allErrors: false, botError: true, banCheckError: true },
  });

  if (error) return fail(errorToFeature(error));

  try {
    await guild.members.unban(target.id, reason ?? undefined);
    await createCase(guild, target, "UNBAN", moderator, reason);
    return ok({
      title: "Unbanned user.",
      reason,
    });
  } catch (error) {
    return fail(errorToFeature(error));
  }
}

export const unban = feature("mod/unban", method);
