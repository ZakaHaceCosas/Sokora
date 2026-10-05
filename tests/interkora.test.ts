import { test, expect, beforeAll, describe } from "bun:test";
import { interkora } from "api/v1/index";
import { generateMessage } from "./utilities";
import { setSetting } from "database/settings";
import { DEV_GUILD_ID } from "const";
import { buildPayloadFromMessage } from "api/v1/message";
import { client } from "botfile";

beforeAll(async () => {
  await setSetting(DEV_GUILD_ID, "interkora", "enabled", true);
  await setSetting(DEV_GUILD_ID, "leveling", "enabled", false);
  await setSetting(DEV_GUILD_ID, "leveling", "xp_gain", 60);
});

async function makeMessage(t: string): ReturnType<typeof buildPayloadFromMessage> {
  return await buildPayloadFromMessage(await generateMessage(t));
}

describe("interkora settings module", () => {
  test("interkora getters work", async () => {
    const out = await Promise.all([
      interkora(await makeMessage("soko!get settings leveling.enabled"), client),
      interkora(await makeMessage("soko!get settings interkora"), client),
      interkora(
        await makeMessage(
          "\n\n    soko!          get                     settings                leveling.enabled        \n\n",
        ),
        client,
      ),
    ]);

    expect(out).toEqual([
      {
        ok: true,
        getterOutput: ["false"],
        importOutput: [],
        queryOutput: [],
        setterOutput: [],
      },
      {
        ok: true,
        getterOutput: [
          JSON.stringify({
            enabled: true,
            whitelist: [],
            webhook_whitelist: [],
          }),
        ],
        importOutput: [],
        queryOutput: [],
        setterOutput: [],
      },
      {
        ok: true,
        getterOutput: ["false"],
        importOutput: [],
        queryOutput: [],
        setterOutput: [],
      },
    ]);
  });
});
