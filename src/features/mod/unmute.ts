import type { Guild, User } from "discord.js";
import { getModError } from "embeds/modEmbed";
import { safeMember } from "utils/safeThings";
import type { FeatureOutput } from "types";
import { errorToFeature } from "utils/errorType";
import { feature, type MethodParameters } from "utils/feature";

interface P {
  reason: string | null;
  isSilent: boolean;
  target: User;
  guild: Guild;
}

interface O {
  title: string;
  reason: string | null;
}

async function method(...parameters: MethodParameters<P, O>): Promise<FeatureOutput<O>> {
  const [ok, fail, options] = parameters;
  const { target: targetUser, reason, guild } = options;
  const target = await safeMember(guild, targetUser.id);

  const error = await getModError("ModerateMembers", {
    target: targetUser,
    action: "UNMUTE",
    errorOptions: { allErrors: false, botError: true, outsideError: true },
  });

  if (error) return fail(errorToFeature(error));

  if (!target?.isCommunicationDisabled())
    return fail({
      title: "You can’t unmute this user.",
      reason: "The user was never muted.",
    });

  try {
    await target?.edit({ communicationDisabledUntil: null });
    return ok({
      title: `Unmuted ${target.user.username}`,
      reason,
    });
  } catch (error) {
    return fail(errorToFeature(error));
  }
}

export const unmute = feature("mod/unmute", method);
