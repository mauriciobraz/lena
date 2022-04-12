import Jimp from 'jimp';
import { Discord, Slash, SlashOption } from 'discordx';

import { DEFAULT_PALETTES } from './defaults';
import {
  CommandInteraction,
  MessageAttachment,
  MessageEmbed,
} from 'discord.js';

const PREVIEW_IMAGE_SIZE = 24;

@Discord()
export default class CustomColors {
  private _cachedImages: Set<{ id: string; source: Buffer }> = new Set();

  constructor() {
    this._cacheImagePreview();
  }

  @Slash('preview', {
    description: 'Mostra uma imagem com as cores padrões do servidor.',
  })
  async handlPreview(
    @SlashOption('blur', { required: false, type: 'BOOLEAN' })
    blur: boolean = false,
    interaction: CommandInteraction
  ) {
    if (!interaction.deferred)
      await interaction.deferReply({ ephemeral: true });

    const files = await Promise.all(
      [...DEFAULT_PALETTES].map(([, colors]) =>
        this._buildImagePreview(
          colors.map(color => color.hex),
          blur
        )
      )
    );

    await interaction.editReply({
      content: `Respectivamente, as paletas são: ${[...DEFAULT_PALETTES]
        .map(([name]) => name)
        .join(', ')}.`,
      files,
    });
  }

  /** Pre-renders all the palettes and adds them to the cache. */
  private _cacheImagePreview() {
    const allPalettes = [...DEFAULT_PALETTES];

    for (const [name, colors] of allPalettes) {
      const hexColors = colors.map(color => color.hex);

      this._buildImagePreview(hexColors).then(image => {
        this._cachedImages.add({ id: name, source: image });
      });
    }
  }

  /**
   * Builds an image with the given colors in the given order and returns it an a buffer.
   * @param colors Should be an array of hexadecimal colors.
   */
  private async _buildImagePreview(
    colors: number[],
    blur?: boolean
  ): Promise<Buffer> {
    const image = await Jimp.create(
      colors.length * PREVIEW_IMAGE_SIZE,
      PREVIEW_IMAGE_SIZE
    );

    for (let i = 0; i < colors.length; i++) {
      const color = Jimp.rgbaToInt(
        (colors[i] >> 16) & 255,
        (colors[i] >> 8) & 255,
        colors[i] & 255,
        255
      );

      for (let x = 0; x < PREVIEW_IMAGE_SIZE; x++) {
        for (let y = 0; y < PREVIEW_IMAGE_SIZE; y++) {
          image.setPixelColor(color, x + i * PREVIEW_IMAGE_SIZE, y);
        }
      }
    }

    blur && image.blur(PREVIEW_IMAGE_SIZE);

    return image.getBufferAsync(Jimp.MIME_PNG);
  }
}
