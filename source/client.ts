import G from 'glob';
import { Client as ClientX } from 'discordx';
import { resolve } from 'path';
import {
  DiscordXConfiguration,
  TemporaryVoiceConfiguration,
} from './config/configuration';

import { TemporaryVoice } from './services/temporary-voice';
import { isSnowflake, validateOrThrow } from './helpers';

export function createClient(): ClientX {
  const clientX = new ClientX({ ...DiscordXConfiguration });

  clientX.once('ready', async () => {
    await recursivelyImport(resolve(__dirname, 'modules', '**', '*.{js,ts}'));
    await clientX.initApplicationCommands();

    const temporaryEntryChannelId = validateOrThrow(
      process.env.TEMPORARY_ENTRY_CHANNEL_ID,
      isSnowflake
    );

    new TemporaryVoice(clientX).addEntryChannel(
      temporaryEntryChannelId,
      TemporaryVoiceConfiguration
    );
  });

  return clientX;
}

function recursivelyImport(path: string): Promise<any[]> {
  return Promise.all(G.sync(path).map(file => import(file)));
}
