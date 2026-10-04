import { listUserCases, removeCase } from "database/moderation";
import type { Guild, User } from "discord.js";
import { getModError } from "embeds/modEmbed";
import type { FeatureOutput } from "types";
import { errorToFeature } from "utils/errorType";
import { feature, type MethodParameters } from "utils/feature";
import { mention } from "utils/mention";

interface P {
  target: User;
  moderator: User;
  guild: Guild;
  isSilent: boolean;
  warnId: number;
}

interface O {
  title: string;
  reason: string | null;
}

async function method(...parameters: MethodParameters<P, O>): Promise<FeatureOutput<O>> {
  const [ok, fail, options] = parameters;
  const { target, warnId, guild } = options;

  const error = await getModError("ModerateMembers", {
    target,
    // TODO: add delwarn or document that warn is used for delwarn too, either of those
    action: "WARN",
    errorOptions: { allErrors: true, botError: false },
  });

  if (error) return fail(errorToFeature(error));

  const warns = await listUserCases(guild.id, target.id, "WARN");
  const newWarns = warns.filter(warn => warn.id != warnId);

  if (newWarns.length == warns.length)
    return fail({
      title: `There is no warning with the id of ${warnId}.`,
    });

  try {
    await removeCase(guild.id, warnId);
  } catch (error) {
    return fail(errorToFeature(error));
  }

  return ok({
    title: `Removed a warning from ${mention(target.id, "USER")}`,
    // dmTitle: "Your warning has been removed",
    //    isSilent,
    reason: null,
  });
}

export const delwarn = feature("mod/delwarn", method);
