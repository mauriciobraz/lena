import { ArgsOf, Client, Discord, On, Once } from 'discordx';

@Discord()
export class Main {
  @Once('ready')
  async onceReady(_: ArgsOf<'ready'>, client: Client): Promise<void> {
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
}
