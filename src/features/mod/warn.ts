import { createCase } from "database/moderation";
import type { Guild, User } from "discord.js";
import { getModError } from "embeds/modEmbed";
import type { FeatureOutput } from "types";
import { errorToFeature } from "utils/errorType";
import { feature, type MethodParameters } from "utils/feature";

interface P {
  reason: string | null;
  isSilent: boolean;
  moderator: User;
  target: User;
  guild: Guild;
}

interface O {
  title: string;
  reason: string | null;
}

async function method(...parameters: MethodParameters<P, O>): Promise<FeatureOutput<O>> {
  const [ok, fail, options] = parameters;
  const { reason, moderator, target, guild } = options;

  const error = await getModError("ModerateMembers", {
    target,
    action: "WARN",
    errorOptions: { allErrors: true, botError: false, outsideError: true },
  });

  if (error) return fail(errorToFeature(error));

  await createCase(guild, target, "WARN", moderator, reason);

  return ok({
    title: `warned ${target.username}`,
    reason,
  });
}

export const warn = feature("mod/warn", method);
