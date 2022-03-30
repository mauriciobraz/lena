import {
  Client,
  GuildMember,
  Intents,
  Snowflake,
  VoiceChannel,
  VoiceState,
} from 'discord.js';

export interface IParentChannelOptions {
  autoDeleteIfEmpty: boolean;
  channelNameFormat: (opts: { member: GuildMember; count: number }) => string;
  createOnCategory?: Snowflake;
  kickBotsIfAllUsersLeave?: boolean;
}

export interface IParentChannel {
  id: Snowflake;
  options: IParentChannelOptions;
  children: Array<{ ownerId: Snowflake; channelId: Snowflake }>;
}

export const DEFAULT_OPTIONS: IParentChannelOptions = {
  autoDeleteIfEmpty: true,
  channelNameFormat: ({ member, count }) => `#${count} ${member.user.username}`,
};

export class TemporaryVoice {
  private _parentChannels = new Array<IParentChannel>();

  constructor(private readonly client: Client) {
    const intents = new Intents(client.options.intents);

    if (!intents.has('GUILD_VOICE_STATES')) {
      throw new Error(
        'TemporaryVoice service requires the `GUILD_VOICE_STATES` intent to be enabled.'
      );
    }

    client.on('voiceStateUpdate', (oldState, newState) => {
      this._handleVoiceStateUpdate.apply(this, [oldState, newState]);
    });

    client.on('channelDelete', c =>
      c.isVoice() && c.type === 'GUILD_VOICE'
        ? this._handleChannelDelete(c)
        : undefined
    );
  }

  addEntryChannel(id: Snowflake, options: IParentChannelOptions): this {
    const optionsMerged = { ...DEFAULT_OPTIONS, ...options };
    this._parentChannels.push({ id, children: [], options: optionsMerged });

    return this;
  }

  removeEntryChannel(id: Snowflake): this {
    this._parentChannels = this._parentChannels.filter(c => c.id !== id);

    return this;
  }

  private async _handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<void> {
    const voiceChannelLeft: boolean =
      !!oldState.channelId && !newState.channelId;

    const voiceChannelJoined: boolean =
      !oldState.channelId && !!newState.channelId;

    const voiceChannelMoved: boolean =
      !!oldState.channelId &&
      !!newState.channelId &&
      oldState.channelId !== newState.channelId;

    // If the member left a channel or moved to a new one we check if it's a
    // parent channel, and if so, we delete it.
    if (voiceChannelLeft || voiceChannelMoved) {
      console.log('Voice channel left or moved');

      const parentChannel = this._parentChannels.find(c =>
        c.children.some(child => child.channelId === oldState.channelId)
      );

      if (!parentChannel) return;

      const childIdToDelete = parentChannel.children.find(
        child => child.channelId === oldState.channelId
      )?.channelId;

      if (!childIdToDelete) return;

      const channelToDelete = await this.client.channels.fetch(
        childIdToDelete,
        { cache: true }
      );

      // Prevent the channel from being deleted if it's not an voice channel.
      if (channelToDelete?.type !== 'GUILD_VOICE') {
        console.warn(
          `TemporaryVoice: Expected channel ${childIdToDelete} to be a voice` +
            ` channel, but got '${channelToDelete?.type}' instead.`
        );

        return;
      }

      const autoDeleteByEmpty =
        parentChannel.options.autoDeleteIfEmpty &&
        oldState.channel?.members.size === 0;

      const autoDeleteIfAllUsersLeave =
        parentChannel.options.kickBotsIfAllUsersLeave &&
        oldState.channel?.members.every(m => m.user.bot);

      if (autoDeleteByEmpty || autoDeleteIfAllUsersLeave) {
        await channelToDelete
          .delete('Auto-deleted by Temporary Voice.')
          .catch(console.error);

        parentChannel.children = parentChannel.children.filter(
          child => child.channelId !== childIdToDelete
        );
      }
    }

    if (voiceChannelJoined || voiceChannelMoved) {
      const parentChannel = this._parentChannels.find(
        c => c.id === newState.channelId
      );

      // If it's not a parent channel or the member is null, we ignore.
      if (!parentChannel) return;
      if (!newState.member) return;

      let newChannelName = parentChannel.options.channelNameFormat({
        member: newState.member,
        count: parentChannel.children.length + 1,
      });

      // Avoid API errors by checking if the channel name is too long.
      if (newChannelName.length > 100) {
        newChannelName = newChannelName.slice(0, 100);
      }

      const channel = await newState.guild.channels.create(newChannelName, {
        type: 'GUILD_VOICE',
        reason: `Temporary voice channel created for ${newState.member.user.id}`,
        parent: parentChannel.options.createOnCategory,
      });

      await newState.setChannel(channel);

      parentChannel.children.push({
        ownerId: newState.member.id,
        channelId: channel.id,
      });
    }
  }

  private async _handleChannelDelete(channel: VoiceChannel): Promise<void> {
    const parentChannel = this._parentChannels.find(c => c.id === channel.id);

    if (parentChannel) {
      this._parentChannels = this._parentChannels.filter(
        c => c.id !== channel.id
      );

      return;
    }

    const childChannel = this._parentChannels.find(c =>
      c.children.some(child => child.channelId === channel.id)
    );

    if (childChannel) {
      childChannel.children = childChannel.children.filter(
        child => child.channelId !== channel.id
      );
    }
  }
}
