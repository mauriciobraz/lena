import G from 'glob';
import { Collection } from 'discord.js';
import { Client } from 'discordx';
import { resolve } from 'path';

import { CLIENT_OPTIONS } from './config/configuration';
import { validateOrThrow, isSnowflake } from './helpers';
import { PrivateVoice, DELETION_CHECKERS } from './modules/private-voice';

const { TEMPORARY_CATEGORY_ID, TEMPORARY_ENTRY_CHANNEL_ID } = process.env;

export async function createClient(): Promise<Client> {
  const clientX = new Client({ ...CLIENT_OPTIONS });
  await recursivelyImport(resolve(__dirname, 'modules', '**', '*.{js,ts}'));

  PrivateVoice.addNewParent({
    children: new Collection<string, string>(),
    parentId: validateOrThrow(TEMPORARY_ENTRY_CHANNEL_ID, isSnowflake),
    categoryId: validateOrThrow(TEMPORARY_CATEGORY_ID, isSnowflake),
    generateName: ({ member }) => `Call de ${member.displayName}`,
  });

  PrivateVoice.addNewDeleteCheckers(
    DELETION_CHECKERS.WHEN_EMPTY,
    DELETION_CHECKERS.WHEN_ONLY_BOT
  );

  return clientX;
}

function recursivelyImport(path: string): Promise<any[]> {
  return Promise.all(G.sync(path).map(file => import(file)));
}
