import { createCase, getPendingBans } from "database/moderation";
import { type Client, ContainerBuilder, type Guild, TextDisplayBuilder } from "discord.js";
import { useErrorEmbed } from "embeds/errorEmbed";
import { colorize, Sokolors } from "./colorize";
import { logChannel } from "./logChannel";
import { safeGuild } from "./safeThings";
import { mention } from "./mention";
import { MILLISEC_1H } from "./constants";

const scheduledUnbans = new Map<string, Timer>();

async function unbanUser(
  client: Client,
  guild: Guild,
  userId: string,
  modId: string,
  caseId?: number,
): Promise<void> {
  let user;
  try {
    user = (await guild.bans.fetch(userId)).user;
  } catch {
    return await useErrorEmbed({
      client,
      title: `Failed to unban user ${userId} in guild ${guild.id}.`,
      reason: "User not found in the guild’s ban list.",
      fileName: "unbanScheduler",
    });
  }

  caseId ??= (await getPendingBans(Date.now() - MILLISEC_1H)).find(
    ban => ban.user_id == userId,
  )?.id;
  const unbanReason = `Temporary ban by <@${modId}> has expired (cf. case ${caseId})`;
  // idk how can client.user be null but ok - @Golem642
  // client can be accessed before running Client#login(), in which case user IS null - @zakahacecosas
  await createCase(guild.id, userId, "UNBAN", client.user?.id ?? modId, unbanReason);

  await guild.members.unban(user.id, unbanReason);
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## Unbanned ${mention(user.id, "USER")}`),
      new TextDisplayBuilder().setContent(unbanReason),
      new TextDisplayBuilder().setContent(`-# User ID: ${user.id}`),
    )
    .setAccentColor(await colorize({ hue: Sokolors.Green }));

  await logChannel(guild, { components: [container], flags: "IsComponentsV2" });
}

export function scheduleUnban(
  client: Client,
  guild: Guild,
  userID: string,
  modID: string,
  delay: number,
  caseId?: number,
): Map<string, Timer> {
  const guildID = guild.id;
  const key = `${guildID}-${userID}`;
  if (scheduledUnbans.has(key)) clearTimeout(scheduledUnbans.get(key));

  const timeout = setTimeout(
    async () => {
      try {
        await unbanUser(client, guild, userID, modID, caseId);
      } catch (error) {
        await useErrorEmbed({
          client,
          error,
          title: `Failed to unban user ${userID} in guild ${guildID}.`,

          fileName: "unbanScheduler",
        });
      }
      scheduledUnbans.delete(key);
    },
    // this math.min exists because apparently "delay" may surpass the limit
    // by being bigger than a signed int32 in some cases
    Math.min(delay, 2_147_483_646),
  );

  return scheduledUnbans.set(key, timeout);
}

export async function rescheduleUnbans(client: Client): Promise<void> {
  // hopefully a bot restart is faster than an hour lol, otherwise it might miss scheduled unbans
  const now = Date.now() - MILLISEC_1H;
  const bans = await getPendingBans(now);
  for (const ban of bans) {
    if (!ban.expires_at) continue;
    if (typeof ban.expires_at != "number" || Number.isNaN(ban.expires_at)) {
      await useErrorEmbed({
        client,
        title: `Invalid expires_at value for ban: ${ban.expires_at}.`,

        fileName: "unbanScheduler",
      });
      continue;
    }

    try {
      const guildBan = await (await safeGuild(client, ban.guild_id)).bans.fetch(ban.user_id);
      console.log("Rescheduling", ban.id);
      const delay = ban.expires_at - now;
      if (delay > 0)
        scheduleUnban(client, guildBan.guild, ban.user_id, ban.moderator_id, delay, ban.id);
      else
        try {
          await unbanUser(client, guildBan.guild, ban.user_id, ban.moderator_id, ban.id);
        } catch (error) {
          await useErrorEmbed({
            client,
            error,
            title: `Failed to unban user ${ban.user_id} in guild ${ban.guild_id}.`,

            fileName: "unbanScheduler",
          });
        }
    } catch {
      console.log("Unknown ban", ban.id);
    }
  }
  console.log("Rescheduled bans.");
}
