import { Intents } from 'discord.js';
import { ClientOptions } from 'discordx';
import { isSnowflake, validateOrThrow } from '../helpers';
import { IParentChannelOptions } from '../services/temporary-voice';

export const DiscordXConfiguration: ClientOptions = {
  botGuilds: [validateOrThrow(process.env.DISCORD_MAIN_GUILD_ID, isSnowflake)],
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ] as number[],
};

export const TemporaryVoiceConfiguration: IParentChannelOptions = {
  autoDeleteIfEmpty: true,
  kickBotsIfAllUsersLeave: true,
  createOnCategory: validateOrThrow(
    process.env.TEMPORARY_CATEGORY_ID,
    isSnowflake
  ),

  channelNameFormat: ({ member }) => `Call de ${member.user.username}`,
};
