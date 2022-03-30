import 'reflect-metadata';

import Container from 'typedi';
import { DIService } from 'discordx';

import { createClient } from './client';
import { validateOrThrow } from './helpers';

async function main(): Promise<void> {
  validateOrThrow(process.env.NODE_ENV, v =>
    (['development', 'production'] as NodeEnv[]).includes(v)
  );

  DIService.container = Container;
  createClient().login(validateOrThrow(process.env.DISCORD_TOKEN, Boolean));
}

if (require.main === module) main();
