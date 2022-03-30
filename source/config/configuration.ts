import { Intents } from 'discord.js';
import { ClientOptions } from 'discordx';
import { validateOrThrow } from '../helpers';

const RE_DISCORD_ID = /^[0-9]{17,18}$/;

export const DiscordXConfiguration: ClientOptions = {
  botGuilds: [
    validateOrThrow(process.env.DISCORD_MAIN_GUILD_ID, RE_DISCORD_ID.test),
  ],
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ] as number[],
};
