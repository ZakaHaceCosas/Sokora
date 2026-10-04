import { db, values } from ".";
import type { Satisfies, TableDefinition, TypeOfDefinition } from "types";

export type Case = Satisfies<
  TableDefinition,
  {
    name: "moderation";
    definition: {
      guild_id: "TEXT";
      user_id: "TEXT";
      type: "TEXT";
      moderator_id: "TEXT";
      reason: "TEXT";
      id: "INTEGER";
      timestamp: "TIMESTAMP";
      expires_at: "mTIMESTAMP";
    };
  }
>;

export type ModType =
  "MUTE" | "UNMUTE" | "WARN" | "KICK" | "BAN" | "UNBAN" | "LOCK" | "UNLOCK" | "SLOWDOWN";

export async function createCase(
  guildID: string,
  userID: string,
  modType: ModType,
  moderator: string,
  reason = "",
  expiresAt?: Date,
): Promise<number> {
  const id: number =
    (values<number>(
      await db`SELECT id FROM moderation WHERE "guild_id" = ${guildID} ORDER BY "id" DESC LIMIT 1;`,
      true,
    )[0] ?? 0) + 1;

  const insObject: TypeOfDefinition<Case> = {
    guild_id: guildID,
    user_id: userID,
    type: modType,
    moderator_id: moderator,
    reason,
    id,
    timestamp: new Date(),
    expires_at: expiresAt,
  };
  await db`INSERT INTO moderation ${db(insObject)};`; // Rare conflict possible if two mods add a case at the approx same moment ?
  return id;
}

export async function listGuildCases(
  guildID: number | string,
  modType?: ModType,
): Promise<TypeOfDefinition<Case>[]> {
  const typeFilter = db`AND "type" = ${modType}`;
  return values<TypeOfDefinition<Case>>(
    await db`
      SELECT * FROM moderation
      WHERE "guild_id" = ${guildID}
      ${modType ? typeFilter : db``}
      ORDER BY "id" DESC;`,
  );
}

export async function listUserCases(
  guildID: number | string,
  userID: number | string,
  modType?: ModType,
): Promise<TypeOfDefinition<Case>[]> {
  const typeFilter = db`AND "type" = ${modType}`;
  return values<TypeOfDefinition<Case>>(
    await db`
      SELECT * FROM moderation
      WHERE "guild_id" = ${guildID}
      AND "user_id" = ${userID}
      ${modType ? typeFilter : db``}
      ORDER BY "id" DESC;`,
  );
}

export async function getCase(
  guildID: number | string,
  id?: number,
): Promise<TypeOfDefinition<Case>[]> {
  const modCase = values<TypeOfDefinition<Case>>(
    await db`SELECT * FROM moderation WHERE "guild_id" = ${guildID} AND "id" = ${id};`,
  );

  return modCase.length > 0 ? modCase : [];
}

export async function editCase(
  guildID: number | string,
  id: number,
  reason: string,
  expiresAt?: Date | null,
): Promise<void> {
  await db`UPDATE moderation SET reason = ${reason}, expires_at = ${expiresAt} WHERE "guild_id" = ${guildID} AND "id" = ${id};`;
}

export async function removeCase(guildID: string | number, id: number): Promise<void> {
  await db`DELETE FROM moderation WHERE "guild_id" = ${guildID} AND id = ${id};`;
}

export async function getPendingBans(currentTime?: number): Promise<TypeOfDefinition<Case>[]> {
  return values<TypeOfDefinition<Case>>(
    await db`SELECT * FROM moderation WHERE "type" = ${"BAN"} AND expires_at IS NOT NULL ${currentTime ? db`AND expires_at > ${new Date(currentTime)}` : db``} ORDER BY guild_id;`,
  );
}
