import 'reflect-metadata';

import { validateOrThrow } from '@helpers/validators';
import { createClient } from './client';
import { DIService } from 'discordx';
import Container from 'typedi';
import { PrismaClient } from '@prisma/client';

async function main(): Promise<void> {
  DIService.container = Container;

  DIService.container.set(
    PrismaClient,
    new PrismaClient({
      log: process.env.PRISMA_LOG
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    })
  );

  const client = await createClient();
  client.login(validateOrThrow(process.env.DISCORD_TOKEN, Boolean));
}

if (require.main === module) main();
