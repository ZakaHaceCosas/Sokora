import { getSetting, setSetting } from "database/settings";
import { db } from "database/index";
import type { TableDefinition, TypeOfDefinition, Satisfies } from "types";

type RequestorsDef = Satisfies<
  TableDefinition,
  {
    name: "itk_requestors";
    definition: {
      guild_id: "TEXT";
      entity_id: "TEXT";
      entity_type: "TEXT";
      timestamp: "TIMESTAMP";
    };
  }
>;

type R = Omit<TypeOfDefinition<RequestorsDef>, "guildId" | "entityType">;

type RegistrationsDef = Satisfies<
  TableDefinition,
  {
    name: "itk_registrations";
    definition: {
      entity_id: "TEXT";
      payload: "OBJECT";
      created_at: "TIMESTAMP";
      updated_at: "TIMESTAMP";
    };
  }
>;

export async function getRegistration(entity_id: string): Promise<{}> {
  const res = await db<
    TypeOfDefinition<RegistrationsDef>[]
  >`SELECT "payload", "created_at", "updated_at" FROM itk_registrations WHERE "entity_id" = ${entity_id};`;
}

export async function setRegistration(entity_id: string) {
  const res = await db<
    TypeOfDefinition<RegistrationsDef>[]
  >`SELECT "payload", "created_at", "updated_at" FROM itk_registrations WHERE "entity_id" = ${entity_id};`;
}

export async function addWhitelist(
  guildId: string,
  userId: string,
  targetList: "whitelist" | "webhook_whitelist",
): Promise<void> {
  const previous = await getSetting(guildId, "interkora", targetList);
  if (previous.includes(userId)) return;
  const next = [...previous, userId];
  await setSetting(guildId, "interkora", targetList, next);
}

export async function remWhitelist(
  guildId: string,
  userId: string,
  targetList: "whitelist" | "webhook_whitelist",
): Promise<void> {
  const previous = await getSetting(guildId, "interkora", targetList);
  if (!previous.includes(userId)) return;
  const next = previous.filter(index => index != userId);
  await setSetting(guildId, "interkora", targetList, next);
}

export async function getRequestors(guild_id: string, entity_type: "u" | "h"): Promise<R[]> {
  const res = await db<
    R[]
  >`SELECT "entity_id", "request_date" FROM itk_requestors WHERE "guildId" = ${guild_id} AND "entity_type" = ${entity_type};`;
  return res;
}

export async function addRequestor(
  guild_id: string,
  entity_id: string,
  entity_type: "u" | "h",
): Promise<void> {
  await db`INSERT INTO itk_requestors ("guild_id", "entity_id", "entity_type") VALUES (${guild_id}, ${entity_id}, ${entity_type});`;
}

export async function getEntityPermission() {}
