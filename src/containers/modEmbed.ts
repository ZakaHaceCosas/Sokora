// TODO: this is worse than before, not better
// i mean technically better but awful CQ

import { getCase, type ModType } from "database/moderation";
import {
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  type User,
  type Channel,
  type Guild,
  type PermissionFlagsBits,
  type AttachmentBuilder,
} from "discord.js";
import ms from "enhanced-ms";
import { mention } from "utils/mention";
import { safeMember } from "utils/safeThings";
import { colorize, Sokolors } from "utils/colorize";
import { buildErrorEmbed } from "./errorEmbed";
import { logChannel } from "utils/logChannel";

interface ModActionPayload {
  action: ModType;
  guild: Guild;
  channel?: Channel;
  moderator: User;
  target?: User;
  duration?: number;
  shouldDm?: boolean;
  expiresAt?: Date;
  previousCaseId?: number;
}

enum ModErrorCode {
  CaseDoesNotExist,
  CantModerateSokora,
  ModeratorNotFound,
  AlreadyBanned,
  AlreadyUnbanned,
  TargetNotFound,
  NotApiModeratable,
  MissingPermission,
  RolePosSame,
  ChannelDoesNotExist,
  TargetRolePosHigher,
  TargetOutside,
  CantModerateSelf,
}

export type ModError =
  | {
      code: ModErrorCode.MissingPermission;
      permission: keyof typeof PermissionFlagsBits;
    }
  | {
      code: Omit<ModErrorCode, ModErrorCode.MissingPermission>;
  };

  export function isModError(error: unknown): error is ModError {
    return error != null && typeof error == "object"&& Object.hasOwn(error, "code")
  }

  // TODO: check that this is a ModActionResult with success false
  export function isModErroryResult(error: unknown): error is ModError {
    return error != null && typeof error == "object"&& Object.hasOwn(error, "code")
    }

type ModActionResult = (
  | {
      success: true;
    }
  | {
      success: false;
      error: ModError | Error;
    }
) &
  ModActionPayload &
  (
    | {
        caseId: number;
      }
    | {
        caseId?: number;
        previousCaseId: number;
      }
  );

type ErrorOptions = Partial<ModActionPayload> & {
  interaction: ChatInputCommandInteraction;
  errorOptions: {
    allErrors: boolean;
    botError: boolean;
    channelError?: boolean;
    outsideError?: boolean;
    banCheckError?: boolean;
  };
};

type ModEmbedOptions = ModActionResult & {
  isSilent?: boolean;
  reason?: string | null;
  customText?: {
    logTitle: string;
    dmTitle?: string;
  };
};

/**
 * Checks for errors in moderation commands.
 * @param permission The permission that the command requires. If the bot doesn't have it, it errors.
 * @param options Error options.
 * @returns `true` if something goes wrong. `false` otherwise.
 */
export async function getModError(
  permission: keyof typeof PermissionFlagsBits,
  options: ErrorOptions,
): Promise<ModError | undefined> {
  const { interaction, guild, moderator, previousCaseId, target, channel, action, errorOptions } =
    options;
  const { allErrors, botError, channelError, outsideError, banCheckError } = errorOptions;

  if (!guild) return;

  if (previousCaseId) {
    const previousCase = await getCase(guild.id, previousCaseId);
    if (
      previousCase.length === 0 ||
        previousCase[0].user_id != target?.id ||
      previousCase[0].type != action
    )
      return { code: ModErrorCode.CaseDoesNotExist };
  }

  if (!moderator) return { code: ModErrorCode.ModeratorNotFound };

  const member = await safeMember(guild, interaction.user.id);
  const client = await safeMember(guild, interaction.client.user.id);

  if (botError && !client.permissions.has(permission)) {
    return { code: ModErrorCode.MissingPermission, permission };
  }

  if (channelError) {
    if (!channel) {
      return {
        code: ModErrorCode.ChannelDoesNotExist,
      };
    }

    if (channel.isDMBased()) return;
    if (!channel.permissionsFor(client).has("ViewChannel")) {
      return {
        code: ModErrorCode.MissingPermission,
        permission: "ViewChannel",
      };
    }
  }

  if (!member.permissions.has(permission)) {
    return {
      code: ModErrorCode.MissingPermission,
      permission,
    };
  }

  if (banCheckError) {
    if (!target) {
      return {
        code: ModErrorCode.TargetNotFound,
      };
    }

    const isBanned = (await guild.bans.fetch()).has(target.id);
    if (isBanned && action == "BAN") {
      return {
        code: ModErrorCode.AlreadyBanned,
      };
    }

    if (!isBanned && action == "UNBAN") {
      return {
        code: ModErrorCode.AlreadyUnbanned,
      };
    }
  }

  if (!allErrors || !target || !action) return;

  if (outsideError && !target) {
    // target SHOULD exist in server
return {
      code: ModErrorCode.TargetOutside,
    };
  }

  if (!target) return;

  if (target.id == moderator.id) {
    return {
      code: ModErrorCode.CantModerateSelf,
    };
  }

  if (target.id == interaction.client.user.id) {
    return {
      code: ModErrorCode.CantModerateSokora,
    };
  }

  const targetMember = await safeMember(guild, target.id);

  if (!targetMember.moderatable) {
    return {
      code: ModErrorCode.NotApiModeratable,
    };
  }

  const highestModPos = member.roles.highest.position;
  const highestTargetPos = targetMember.roles.highest.position;

  if (highestModPos <= highestTargetPos && member.id != guild.ownerId) {
    const isSamePos: boolean = highestModPos == highestTargetPos;
    {
      return {
        code: isSamePos ? ModErrorCode.RolePosSame : ModErrorCode.TargetRolePosHigher,
      };
    }
  }

  return;
}

export async function errorEmbedFromModError(
  options: ModActionResult & { success : false },
): Promise<[ContainerBuilder, AttachmentBuilder[]]> {
  const { target, action, error } = options;

  // TODO: improve pinpointing on all embeds

  if (Error.isError(error)) {
    return await buildErrorEmbed({
      error,
    })
  }

  if (error.code == ModErrorCode.CaseDoesNotExist)
    return await buildErrorEmbed({
      title: `You can’t edit this ${action.toLowerCase()}.`,
      reason: `The ${action.toLowerCase()} doesn’t exist.`,
    });

  if (error.code == ModErrorCode.ModeratorNotFound)
    return buildErrorEmbed({
      title: `Failed to ${action.toLowerCase()}.`,
      reason: "Cannot find the moderator.",
    });

  if (error.code == ModErrorCode.MissingPermission)
    return buildErrorEmbed({
      title: "The bot can’t execute this command.",
      // TODO: type error
      reason: `The bot is missing the **\`${(error ).permission}\`** permission. If you want to run this command, you might want to give the bot this permission.`,
    });

  if (error.code == ModErrorCode.ChannelDoesNotExist) {
    return buildErrorEmbed({
      title: "The bot can’t execute this command.",
      reason: "The provided channel does not exist!",
    });
  }

  if (error.code == ModErrorCode.TargetNotFound) {
    return await buildErrorEmbed({
      title: "You can’t ban this user.",
      reason: "This user doesn’t exist.",
    });
  }

  if (error.code == ModErrorCode.AlreadyBanned) {
    return await buildErrorEmbed({
      title: "You can’t ban this user.",
      reason: "This user is already banned.",
    });
  }

  if (error.code == ModErrorCode.AlreadyUnbanned)
    return buildErrorEmbed({
      title: "You can’t unban this user.",
      reason: "This user isn’t currently banned.",
    });

  if (error.code == ModErrorCode.TargetOutside)
    return buildErrorEmbed({
      title: `You can’t ${action.toLowerCase()} ${target?.displayName}.`,
      reason: "This user isn’t in this server.",
    });

  if (error.code == ModErrorCode.CantModerateSelf) {
    return buildErrorEmbed({ title: `You can’t ${action.toLowerCase()} yourself.` });
  }

  if (error.code == ModErrorCode.CantModerateSokora) {
    return buildErrorEmbed({ title: `You can’t ${action.toLowerCase()} Sokora.` });
  }

  if (error.code == ModErrorCode.NotApiModeratable)
    return buildErrorEmbed({
      title: `You can’t ${action.toLowerCase()} ${target?.displayName}.`,
      reason: [
        "The member cannot be moderated by Sokora.\n",
        "**There are three reasons as to why this error might occur:**",
        "- The member has a higher role position than the bot;",
        "- The member is an administrator;",
        "- The member is the owner of the server.",
      ].join("\n"),
    });

  if (error.code == ModErrorCode.RolePosSame || error.code == ModErrorCode.TargetRolePosHigher)
    return buildErrorEmbed({
      title: `You can’t ${action.toLowerCase()} ${target?.displayName}.`,
      reason: `The member has ${error.code == ModErrorCode.RolePosSame ? "the same" : "a higher"} role position ${error.code == ModErrorCode.RolePosSame ? "as" : "than"} you.`,
    });

  throw new Error(`Unhandled ModError type: ${JSON.stringify(error)}`);
}

function produceGeneralValues(modAction: ModEmbedOptions): string[] {
  const { moderator, reason, duration, channel } = modAction;
  const generalValues = [`**Moderator**: ${moderator.displayName}`];
  if (reason) generalValues.push(`**Reason**: ${reason}`);
  if (duration) generalValues.push(`**Duration**: ${ms(duration, "fullPrecision")}`);
  if (channel) generalValues.push(`**Channel**: ${mention(channel.id, "CHANNEL")}`);
  return generalValues;
}

/**
 * Sends a container containing information about a moderation action.
 * @param options Options
 * @param reason Reason for the moderation action.
 * @returns A container with action info (or an errorEmbed if something goes wrong).
 */
export async function buildModEmbed(modAction: ModEmbedOptions): Promise<ContainerBuilder> {
  const { guild, target, previousCaseId, caseId, action, channel, customText } = modAction;

  const generalValues = produceGeneralValues(modAction);
  const serverAvatar = (guild.icon ? guild.iconURL() : undefined) ?? undefined;
  const avatar = target ? target.displayAvatarURL() : serverAvatar;
  let title = `${previousCaseId ? "Edited a " : ""}${previousCaseId ? action?.toLowerCase() : action}${previousCaseId ? " on" : ""}${target ? mention(target.id, "USER") : ""}`;

  if (previousCaseId ?? caseId) {
    title += `  •  #${previousCaseId ?? caseId}`;
  }

  const textDisplayComponents = [
    new TextDisplayBuilder().setContent(`**${customText?.logTitle ?? title}**`),
    new TextDisplayBuilder().setContent(generalValues.join("\n")),
    new TextDisplayBuilder().setContent(
      `-# ${target ? `User ID: ${target.id}` : `Channel ID: ${channel}`} • ${mention(Date.now(), "DEFAULT_TIMESTAMP")}`,
    ),
  ];

  const container = new ContainerBuilder().setAccentColor(await colorize({ hue: Sokolors.Green }));
  if (avatar)
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(textDisplayComponents)
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatar)),
    );
  else container.addTextDisplayComponents(textDisplayComponents);

  return container;
}

export async function buildDmModEmbed(modAction: ModEmbedOptions): Promise<ContainerBuilder> {
  const { guild, action, customText } = modAction;
  const generalValues = produceGeneralValues(modAction);

  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        customText?.dmTitle ?? `**You got ${action?.toLowerCase()} from ${guild.name}**`,
      ),
      new TextDisplayBuilder().setContent(generalValues.join("\n")),
      new TextDisplayBuilder().setContent(`-# ${mention(Date.now(), "DEFAULT_TIMESTAMP")}`),
    )
    .setAccentColor(await colorize({ hue: Sokolors.Red }));
}

export async function useModEmbed(options: ModEmbedOptions, shouldDm = false): Promise<void> {
  const container = await buildModEmbed(options)

  await logChannel(
       options.guild,
       { components: [container], flags: "IsComponentsV2" },
       shouldDm,
       options.target
         ? {
             isSilent: options.isSilent ?? false,
             user: options.target,
             options: {
               components: [
                 await buildDmModEmbed(options)
               ],
               flags: "IsComponentsV2",
             },
           }
         : undefined,
     )
}
