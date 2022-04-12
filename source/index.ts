import 'reflect-metadata';

import { validateOrThrow } from '@helpers/validators';
import { createClient } from './client';

async function main(): Promise<void> {
  const client = await createClient();
  client.login(validateOrThrow(process.env.DISCORD_TOKEN, Boolean));
}

if (require.main === module) main();
