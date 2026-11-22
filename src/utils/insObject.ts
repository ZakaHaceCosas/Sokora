import { db } from "database/index";
import type { TableDefinition, TypeOfDefinition } from "types";

// NOTE: this is to stop Bun from breaking because "who tf is Temporal.Instant?????"
export async function insertObject<T extends TableDefinition>(
  table: string,
  payload: TypeOfDefinition<T>,
  tx: Bun.SQL = db,
): Promise<void> {
  const newObject: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload))
    newObject[key] = value instanceof Temporal.Instant ? value.toString() : value;

  return await tx`INSERT INTO ${tx(table)} ${tx(newObject)}`;
}
