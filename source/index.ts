import 'reflect-metadata';

import { __DEV__, __PROD__ } from '@constants';
import { validateOrThrow } from '@helpers/validators';
import { createClient } from './client';

async function main(): Promise<void> {
  if (!__DEV__ || !__PROD__)
    throw new Error(
      'Invalid NODE_ENV. Valid values are "development" and "production".'
    );

  const client = await createClient();
  client.login(validateOrThrow(process.env.DISCORD_TOKEN, Boolean));
}

if (require.main === module) main();
