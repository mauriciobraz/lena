import G from 'glob';
import { Collection, PermissionString } from 'discord.js';
import { Client } from 'discordx';
import { resolve } from 'path';

import { validateOrThrow, isSnowflake } from '@helpers/validators';
import { PrivateVoice, DELETION_CHECKERS } from './modules/private-voice';

const { TEMPORARY_CATEGORY_ID, TEMPORARY_ENTRY_CHANNEL_ID } = process.env;

/**
 * Required permissions for the bot to run, must check for all permissions
 * when joining a new guild.
 */
export const REQUIRED_PERMISSIONS: PermissionString[] = [
  'SEND_MESSAGES',
  'MANAGE_MESSAGES',
  'READ_MESSAGE_HISTORY',
  'EMBED_LINKS',
  'MANAGE_CHANNELS',
  'VIEW_CHANNEL',
  'MOVE_MEMBERS',
];

export async function createClient(): Promise<Client> {
  const client = new Client({
    botGuilds: [client => client.guilds.cache.map(guild => guild.id)],
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES'],
  });
  await recursivelyImport(resolve(__dirname, 'modules', '**', '*.{js,ts}'));

  PrivateVoice.addNewParent({
    children: new Collection<string, string>(),
    parentId: validateOrThrow(TEMPORARY_ENTRY_CHANNEL_ID, isSnowflake),
    categoryId: validateOrThrow(TEMPORARY_CATEGORY_ID, isSnowflake),
    generateName: ({ member }) => `Call de ${member.displayName}`,
  });

  PrivateVoice.addDeletionValidator(
    DELETION_CHECKERS.WHEN_EMPTY,
    DELETION_CHECKERS.WHEN_ONLY_BOT
  );

  return client;
}

function recursivelyImport(path: string): Promise<any[]> {
  return Promise.all(G.sync(path).map(file => import(file)));
}
