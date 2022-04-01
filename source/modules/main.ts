import { ArgsOf, Client, Discord, On, Once } from 'discordx';
import { REQUIRED_PERMISSIONS } from '../config/configuration';

@Discord()
export class Main {
  @Once('ready')
  async onceReady(_: ArgsOf<'ready'>, client: Client): Promise<void> {
    await this._ensureHasAllPermissions(client);

    await client.initApplicationCommands();
    await client.initApplicationPermissions();
  }

  @On('interactionCreate')
  async onInteractionCreate(
    [interaction]: ArgsOf<'interactionCreate'>,
    client: Client
  ): Promise<void> {
    await client.executeInteraction(interaction);
  }

  /**
   * Checks if the bot has all the permisions defined in the configuration file.
   * @throws {Error} If the bot doesn't have all the permissions.
   */
  private async _ensureHasAllPermissions(client: Client): Promise<void> {
    if (!process.env.DISCORD_MAIN_GUILD_ID) {
      throw new Error(
        'Missing the DISCORD_MAIN_GUILD_ID environment variable.'
      );
    }

    const mainGuild = client.guilds.cache.get(
      process.env.DISCORD_MAIN_GUILD_ID
    );

    if (!mainGuild) {
      throw new Error('Could not find the main guild. Is the id correct?');
    }

    const missingPermissions = REQUIRED_PERMISSIONS.filter(
      permission => !mainGuild.me?.permissions.has(permission)
    );

    if (missingPermissions.length > 0) {
      throw new Error(
        'Missing the following permissions: ' + missingPermissions.join(', ')
      );
    }
  }
}
