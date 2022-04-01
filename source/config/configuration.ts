import { Intents, PermissionString } from 'discord.js';
import { ClientOptions } from 'discordx';

import { isSnowflake, validateOrThrow } from '../helpers';

/** Options for the `Discord.Client`. */
export const CLIENT_OPTIONS: ClientOptions = {
  botGuilds: [validateOrThrow(process.env.DISCORD_MAIN_GUILD_ID, isSnowflake)],
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ] as number[],
};

/**
 * Permissions that are required to use the bot. This is used to prevent errors,
 * if you add a new command, check what permissions you need and add them here.
 */
export const REQUIRED_PERMISSIONS: PermissionString[] = [
  // General permissions
  'SEND_MESSAGES',
  'MANAGE_MESSAGES',
  'READ_MESSAGE_HISTORY',
  'EMBED_LINKS',

  // PrivateVoice
  'MANAGE_CHANNELS',
  'VIEW_CHANNEL',
  'MOVE_MEMBERS',
];
