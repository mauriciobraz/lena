import { PrismaClient } from '@prisma/client';
import {
  Channel,
  Collection,
  CommandInteraction,
  Guild,
  GuildMember,
  Snowflake,
  VoiceBasedChannel,
} from 'discord.js';
import {
  ArgsOf,
  Client,
  Discord,
  On,
  Slash,
  SlashGroup,
  SlashOption,
} from 'discordx';
import { Service } from 'typedi';

import { PrivateVoiceQueries } from '../queries/private-voice';

/** Generates the name of the voice channel. */
export type NameGeneratorFn = (options: {
  member: GuildMember;
  guild: Guild;
  count: number;
}) => string;

/** Options for creating a child voice channel. */
export type VoiceChild = {
  channelId: Snowflake;
  orphaned: boolean;
  ownerId: Snowflake;
};

/**
 * Interface for parent channels (entry channels) listeners and their children.
 */
export interface VoiceParent {
  /** Category to create new private channels in. */
  categoryId?: string;

  /** Collection of `owner` to `private channel id`. */
  children: VoiceChild[];

  /** The channel to listen for new private channels create requests. */
  parentId: string;

  /** Function to generate the name of the private channel. */
  generateName: NameGeneratorFn;
}

/**
 * Function to add a new checkers that will be called when a new private channel
 * is requested to be deleted.
 */
export type ChildDeletionValidatorFn = (options: {
  member: GuildMember;
  channel: VoiceBasedChannel;
  orphaned: boolean;
}) => boolean;

export const DEFAULT_NAME_GENERATOR: NameGeneratorFn = ({ member }) =>
  `Call de ${member.displayName}`;

const GROUP_NAME = 'private-voice';

/**
 * Module for managing private voice channels. This module is responsible for
 * listening for new private voice channels create requests and creating them.
 */
@Discord()
@SlashGroup({ name: GROUP_NAME })
@Service()
export class PrivateVoice {
  private static readonly _deletionValidators: ChildDeletionValidatorFn[] = [];

  private static readonly _parents: Collection<string, VoiceParent> =
    new Collection();

  constructor(private readonly _prismaClient: PrismaClient) {}

  @On('voiceStateUpdate')
  async onVoiceStateUpdate(
    [oldState, newState]: ArgsOf<'voiceStateUpdate'>,
    client: Client
  ) {
    const voiceChannelJoined = !oldState.channelId && !!newState.channelId;

    const voiceChannelLeft = !!oldState.channelId && !newState.channelId;

    const voiceChannelMoved =
      !!oldState.channelId &&
      !!newState.channelId &&
      oldState.channelId !== newState.channelId;

    // When the members leaves or moves to another channel, we need to check if
    // the channel is a `PVC` and if so, we need to delete it.
    if (voiceChannelLeft || voiceChannelMoved) {
      if (!oldState.channel || !oldState.member) return;

      if (oldState.channel && oldState.member) {
        const oldStateParent = PrivateVoice._parents.find(p =>
          p.children.some(children => children.channelId === oldState.channelId)
        );

        if (oldStateParent) {
          const childChannelObj = oldStateParent.children.find(
            children => children.channelId === oldState.channelId
          );

          if (!childChannelObj) return;

          const childChannel = await client.channels.fetch(
            childChannelObj.channelId
          );

          if (childChannel?.type !== 'GUILD_VOICE') {
            return console.warn(
              `TemporaryVoice: Expected channel ${childChannelObj} to be "GUILD_VOICE" but got "${childChannel?.type}" instead.`
            );
          }

          const shouldDelete = PrivateVoice._deletionValidators.every(
            validator =>
              validator({
                channel: childChannel,
                member: oldState.member!,
                orphaned: childChannelObj.orphaned,
              })
          );

          if (shouldDelete) {
            oldStateParent.children.splice(
              oldStateParent.children.findIndex(
                children => children.channelId === childChannelObj.channelId
              ),
              1
            );
            await childChannel.delete();
          }
        }
      }
    }

    // If the member joined or moved to an parent channel, we create a new
    // private channel for it based on the parent channel configuration.
    if (voiceChannelJoined || voiceChannelMoved) {
      const newStateParent = PrivateVoice._parents.find(parent => {
        return parent.parentId === newState.channelId;
      });

      if (newStateParent && newState.member) {
        const newName = newStateParent.generateName({
          member: newState.member,
          guild: newState.guild,
          count: newStateParent.children.length + 1,
        });

        const newChannel = await newState.guild.channels.create(newName, {
          parent: newStateParent.categoryId,
          type: 'GUILD_VOICE',
        });

        newStateParent.children.push({
          channelId: newChannel.id,
          orphaned: false,
          ownerId: newState.member.id,
        });
        await newState.setChannel(newChannel);
      }
    }
  }

  @Slash('configure', {
    description: 'Configura o módulo de canais de voz privados.',
  })
  @SlashGroup(GROUP_NAME)
  async handleConfigure(
    @SlashOption('channel')
    channel: Channel,

    @SlashOption('category-id', { type: 'STRING', required: false })
    categoryId: string,

    @SlashOption('allow-change-name', { type: 'BOOLEAN', required: false })
    allowChangeName: boolean = false,

    interaction: CommandInteraction
  ): Promise<void> {
    if (!interaction.deferred)
      await interaction.deferReply({ ephemeral: true });

    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.editReply(
        'Você deve estar em um servidor para usar este comando.'
      );
      return;
    }

    if (!channel.isVoice()) {
      await interaction.editReply('O canal deve ser um canal de voz.');
      return;
    }

    if (!categoryId) {
      const category = await interaction.guild.channels.create(
        'Canais de voz privados',
        { type: 'GUILD_CATEGORY' }
      );
      categoryId = category.id;
    }

    await PrivateVoiceQueries.configure(this._prismaClient, {
      allowChangeName,
      categoryId,
      guildId: interaction.guild.id,
      parentId: channel.id,
    });

    PrivateVoice.createParent({
      categoryId,
      children: [],
      generateName: DEFAULT_NAME_GENERATOR,
      parentId: channel.id,
    });

    await interaction.editReply(
      'Canal de voz privado configurado com sucesso.'
    );
  }

  /**
   * Adds a new checker that will be called when a private voice channel should
   * be deleted.
   */
  static addDeletionValidators(
    ...validators: ChildDeletionValidatorFn[]
  ): void {
    this._deletionValidators.push(...validators);
  }

  /**
   * Adds the given parents to the collection of parents and starts listening
   * for new private channels create requests.
   */
  static createParent(parent: VoiceParent): void {
    this._parents.set(parent.parentId, parent);
  }
}
