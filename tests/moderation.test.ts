import { describe, expect, test } from "bun:test";
import { client } from "botfile";
import { DEV_GUILD_ID, TESTER_USER_A, TESTER_USER_B } from "utils/constants";
import { warn } from "features/mod/warn";
import { getCase } from "database/moderation";

if (!DEV_GUILD_ID || !TESTER_USER_A || !TESTER_USER_B) {
  throw new Error("Required environment variables are not set");
}

const guild = await client.guilds.fetch(DEV_GUILD_ID);
const moderator = await client.users.fetch(TESTER_USER_A);
const target = await client.users.fetch(TESTER_USER_B);

describe("moderation features", () => {
  test("warn feature works", async () => {
    const result = await warn({
      guild,
      moderator,
      target,
      reason: "Test warning",
      isSilent: false,
    });

    expect(result.success).toBe(true);

    const cases = await getCase(guild.id);

    expect(cases.length).toBeGreaterThan(0);
    expect(cases[0].user_id).toBe(target.id);
    expect(cases[0].moderator_id).toBe(moderator.id);
    expect(cases[0].type).toBe("WARN");
  });
});
