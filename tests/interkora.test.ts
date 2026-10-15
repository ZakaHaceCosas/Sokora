import { test, expect, beforeAll, describe } from "bun:test";
import { interkora } from "api/v1/index";
import { setup, state } from "./utilities";
import { setSetting } from "database/settings";
import { TESTER_CHANNEL } from "utils/constants";
import { buildPayloadFromMessage } from "api/v1/message";

beforeAll(async () => {
  await setup();

  await setSetting(state.guild.id, "interkora", "enabled", true);
  await setSetting(state.guild.id, "leveling", "enabled", false);
  await setSetting(state.guild.id, "leveling", "xp_gain", 60);
});

async function makeMessage(content: string): ReturnType<typeof buildPayloadFromMessage> {
  if (!TESTER_CHANNEL) throw new Error("No tester_channel!");
  const channel = state.guild.channels.cache.get(TESTER_CHANNEL);
  if (!channel?.isSendable()) throw new Error("Not sendable!");
  const message = await channel.send({
    content,
  });
  return buildPayloadFromMessage(message);
}

describe("interkora settings module", () => {
  test("interkora getters work", async () => {
    const messages = await Promise.all([
      makeMessage("soko!get settings leveling.enabled"),
      makeMessage("soko!get settings interkora"),
      makeMessage(
        "\n\n    soko!          get                     settings                leveling.enabled        \n\n",
      ),
    ]);
    const out = await Promise.all(messages.map(async m => interkora(m, state.client)));

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
