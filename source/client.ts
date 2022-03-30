import G from 'glob';
import { Client as ClientX } from 'discordx';
import { resolve } from 'path';
import { DiscordXConfiguration } from './config/configuration';

export function createClient(): ClientX {
  const clientX = new ClientX({ ...DiscordXConfiguration });

  clientX.once('ready', _ => {
    recursivelyImport(resolve(__dirname, 'modules'));
    clientX.initApplicationCommands();
  });

  return clientX;
}

function recursivelyImport(path: string): Promise<any[]> {
  return Promise.all(G.sync(path).map(file => import(file)));
}
