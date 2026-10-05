import packageJson from "../../package.json" with { type: "json" };

/* eslint-disable unicorn/consistent-boolean-name */
export const MILLISEC_15M = 900_000;
export const MILLISEC_30M = 1_800_000;
export const MILLISEC_1H = 3_600_000;
export const MILLISEC_6H = 21_600_000;
export const MILLISEC_12H = 43_200_000;
export const SECONDS_7D = 604_800;
export const MILLISEC_28D = 2_419_200_000;

/**
240 000 milliseconds
*/
export const COLLECTOR_DURATION = 240_000;

export const MAX_INPUT_CHARS = 3600;

export const BOT_VERSION = packageJson.version;

export const MADE_WITH_EMOJI = (): string[] => {
  return Math.round(Math.random() * 100) <= 5
    ? ["⌨️", "💻", "🖥️"]
    : ["💖", "💝", "💓", "💗", "💘", "💟", "💕", "💞"];
};

export const TOKEN = process.env.TOKEN;
export const TOPGG_TOKEN = process.env.TOPGG_TOKEN;
export const DATABASE_URL = process.env.DATABASE_URL;
export const ENABLE_MEDIA_FETCHING = process.env.ENABLE_MEDIA_FETCHING;

export const OWNER = process.env.OWNER ?? "725985503177867295";
export const IS_CANARY = process.env.CANARY === "true";
export const DEV_GUILD_ID = process.env.DEVELOPMENT_GUILD_ID ?? "862269637575573504";
export const DEV_IRL_TESTING_ENABLED = process.env.DEVELOPMENT_ENABLE_IRL_TEST_SUITE === "true";
export const TESTER_USER_A = process.env.TESTER_USER_ID_A;
export const TESTER_USER_B = process.env.TESTER_USER_ID_B;
export const ERROR_CHANNEL_ID = process.env.ERROR_CHANNEL_ID;
export const REPORT_CHANNEL_ID = process.env.REPORT_CHANNEL_ID;
