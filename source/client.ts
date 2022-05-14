import Container from 'typedi';
import G from 'glob';
import { PrismaClient } from '@prisma/client';
import { PermissionString } from 'discord.js';
import { Client } from 'discordx';
import { resolve } from 'path';

import {
  ChildDeletionValidatorFn,
  DEFAULT_NAME_GENERATOR,
  PrivateVoice,
} from './modules/private-voice';

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

/**
 * Runs when some channel is requested to be deleted, must return an boolean.
 */
const DELETION_VALIDATORS: { [key: string]: ChildDeletionValidatorFn } = {
  /**
   * Checks if the channel has only bots in it or it is an orphaned channel.
   */
  WHEN_EMPTY: ({ channel, orphaned }) => {
    return channel.members.every(member => member.user.bot) || !orphaned;
  },
};

export async function createClient(): Promise<Client> {
  const client = new Client({
    botGuilds: [client => client.guilds.cache.map(guild => guild.id)],
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES'],
  });
  await recursivelyImport(resolve(__dirname, 'modules', '**', '*.{js,ts}'));

  await setupPrivateVoiceService();

  return client;
}

function recursivelyImport(path: string): Promise<any[]> {
  return Promise.all(G.sync(path).map(file => import(file)));
}

async function setupPrivateVoiceService() {
  PrivateVoice.addDeletionValidators(...Object.values(DELETION_VALIDATORS));

  const guilds = await Container.get(PrismaClient).guild.findMany({
    where: {
      PrivateVoiceConfig: { isNot: null },
    },
    select: {
      id: true,
      PrivateVoiceConfig: { select: { parentId: true, categoryId: true } },
    },
  });

  for (const { PrivateVoiceConfig } of guilds) {
    if (!PrivateVoiceConfig) continue;

    PrivateVoice.createParent({
      children: [],
      parentId: PrivateVoiceConfig.parentId,
      categoryId: PrivateVoiceConfig.categoryId,
      generateName: DEFAULT_NAME_GENERATOR,
    });
  }
}
