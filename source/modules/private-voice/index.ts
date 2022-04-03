import { Collection, Guild, GuildMember, VoiceBasedChannel } from 'discord.js';
import { ArgsOf, Client, Discord, On } from 'discordx';

/** Generates the name of the voice channel. */
export type NameGenerator = (options: {
  /** Owner of the private channel. */
  member: GuildMember;
  /** Guild the owner is in. */
  guild: Guild;
  /** Quantity of private channels existing in the parent. */
  count: number;
}) => string;

/**
 * Interface for parent channels (entry channels) listeners and their children.
 */
export interface VoiceParent {
  /** Category to create new private channels in. */
  categoryId?: string;
  /** Collection of `owner` to `private channel id`. */
  children: Collection<string, string>;
  /** The channel to listen for new private channels create requests. */
  parentId: string;
  /** Function that should be added `#PrivateVoice.changeChannelNamer` */
  generateName: NameGenerator;
}

/**
 * Function to add a new checkers that will be called when a new private channel
 * is requested to be deleted.
 */
export type VoiceChildrenCheckFn = (
  member: GuildMember,
  channel: VoiceBasedChannel
) => boolean;

/** Pre-configured checkers for deleting private channels. */
export const DELETION_CHECKERS = {
  /** When the reaches 0 members, the channel will be deleted. */
  WHEN_EMPTY: (_member: GuildMember, channel: VoiceBasedChannel) =>
    channel.members.size === 0,

  /** Similar to `WHEN_EMPTY`, but checks if only bots remain. */
  WHEN_ONLY_BOT: (_member: GuildMember, channel: VoiceBasedChannel) =>
    channel.members.every(member => member.user.bot),
};

/**
 * Module for managing private voice channels. This module is responsible for
 * listening for new private voice channels create requests and creating them.
 */
@Discord()
export class PrivateVoice {
  private static readonly _parents = new Collection<string, VoiceParent>();
  private static readonly _deleteCheckers = new Array<VoiceChildrenCheckFn>();

  @On('channelDelete')
  async onChannelDelete([channel]: ArgsOf<'channelDelete'>, client: Client) {
    const parent = PrivateVoice._parents.find(p => p.children.has(channel.id));
    parent?.children.delete(channel.id);
  }

  @On('voiceStateUpdate')
  async onVoiceStateUpdate(
    [oldState, newState]: ArgsOf<'voiceStateUpdate'>,
    client: Client
  ) {
    const voiceChannelMoved =
      !!oldState.channelId &&
      !!newState.channelId &&
      oldState.channelId !== newState.channelId;

    const voiceChannelJoined = !oldState.channelId && !!newState.channelId;

    const voiceChannelLeft = !!oldState.channelId && !newState.channelId;

    // In case the user is joining a voice channel, we check if there is a
    // parent channel to create a new private channel and move the user to it.
    if (voiceChannelJoined || voiceChannelMoved) {
      const parent = PrivateVoice._parents.find(
        p => p.parentId === newState.channelId
      );

      if (!parent || !newState.member) return;

      const temporaryChannel = await newState.guild.channels.create(
        parent.generateName({
          member: newState.member,
          guild: newState.guild,
          count: parent.children.size,
        }),
        { parent: parent.categoryId, type: 'GUILD_VOICE' }
      );

      parent.children.set(newState.member.id, temporaryChannel.id);
      await newState.setChannel(temporaryChannel);

      return;
    }

    // If the member left a channel or moved to a new one we check if it's a
    // parent channel, and if so, we delete it.
    if (voiceChannelLeft || voiceChannelMoved) {
      if (!oldState.channel || !oldState.member) return;

      const parent = PrivateVoice._parents.find(p =>
        p.children.some(c => c === oldState.channelId)
      );

      if (!parent) return;

      const childChannelId = parent.children.get(oldState.member.id);
      if (!childChannelId) return;

      const childChannel = await client.channels.fetch(childChannelId);

      if (childChannel?.type !== 'GUILD_VOICE') {
        return console.warn(
          `TemporaryVoice: Expected channel ${childChannelId} to be "GUILD_VOICE" but got "${childChannel?.type}" instead.`
        );
      }

      const canDeleteTemporaryChannel = PrivateVoice._deleteCheckers.every(
        checker => {
          if (!oldState.member) return false;
          return checker(oldState.member, childChannel);
        }
      );

      if (canDeleteTemporaryChannel) {
        await childChannel.delete();
      }

      return;
    }
  }

  /**
   * Adds a new checker that will be called when a private voice channel should
   * be deleted.
   */
  static addNewDeleteCheckers(...checkers: VoiceChildrenCheckFn[]): void {
    PrivateVoice._deleteCheckers.push(...checkers);
  }

  /**
   * Adds the given parents to the collection of parents and starts listening
   * for new private channels create requests.
   */
  static addNewParent(parent: VoiceParent): void {
    PrivateVoice._parents.set(parent.parentId, parent);
  }

  /**
   * Searchs for a child channel from the given member and returns it. Could
   * return `undefined` if the member doesn't have a child channel or
   * the channel type is not `GUILD_VOICE` for some reason.
   */
  static async getChildChannel(
    member: GuildMember
  ): Promise<VoiceBasedChannel | undefined> {
    const parent = this._parents.find(p => p.children.has(member.id));

    const childChannelId = parent?.children.get(member.id);
    if (!childChannelId) return;

    const fetchedChannel = await member.guild.channels.fetch(childChannelId, {
      cache: true,
    });

    return fetchedChannel?.type === 'GUILD_VOICE' ? fetchedChannel : undefined;
  }
}
