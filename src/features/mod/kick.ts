import type { Guild, User } from "discord.js";
import { getModError } from "embeds/modEmbed";
import type { FeatureOutput } from "types";
import { errorToFeature } from "utils/errorType";
import { feature, type MethodParameters } from "utils/feature";
import { safeMember } from "utils/safeThings";

interface P {
  target: User;
  moderator: User;
  reason: string | null;
  guild: Guild;
  isSilent: boolean;
}

interface O {
  title: string;
  reason: string | null;
}

async function method(...parameters: MethodParameters<P, O>): Promise<FeatureOutput<O>> {
  const [ok, fail, options] = parameters;
  const { target, guild, reason } = options;

  const error = await getModError("KickMembers", {
    target,
    action: "KICK",
    errorOptions: { allErrors: true, botError: true, outsideError: true },
  });

  if (error) return fail(errorToFeature(error));

  try {
    await (await safeMember(guild, target.id)).kick(reason ?? undefined);
    return ok({
      title: "Kicked",
      reason,
    });
  } catch (error) {
    return fail(errorToFeature(error));
  }
}

export const kick = feature("mod/kick", method);
