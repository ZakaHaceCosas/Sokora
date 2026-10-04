import type { Guild, Message, OmitPartialGroupDMChannel, User } from "discord.js";
import { DEV_GUILD_ID, OWNER } from "const";
import { as, type SafeMessage } from "types";
import { safeMessage } from "utils/safeThings";

export const mockGuild = as<Guild>({
  memberCount: 12 ** 2,
  id: DEV_GUILD_ID,
  name: "Kosora",
  ownerId: OWNER,
  members: {
    cache: {
      get: () => mockUser(),
    },
  },
});

interface MockUserConfig {
  admin: boolean;
}

export function mockUser(_config?: MockUserConfig): User {
  const config: MockUserConfig = _config ?? {
    admin: false,
  };

  return as<User>({
    displayName: "John Sokora",
    username: "mrserge01",
    id: OWNER,
    displayAvatarURL: () =>
      "https://kde.org/stuff/clipart/logo/kde-logo-white-gray-rounded-128x128.png",
    permissions: {
      has: () => config.admin,
    },
  });
}

export async function generateMessage(
  content: string,
  user?: MockUserConfig,
): Promise<SafeMessage> {
  return await safeMessage(
    as<OmitPartialGroupDMChannel<Message>>({
      content,
      partial: false,
      guildId: DEV_GUILD_ID,
      guild: mockGuild,
      author: mockUser(user),
      reply: async (): Promise<OmitPartialGroupDMChannel<Message>> =>
        as<Promise<OmitPartialGroupDMChannel<Message>>>({}),
    }),
    true,
  );
}
