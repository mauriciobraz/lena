import type { FixedLengthArray } from 'type-fest';

export type PaletteName = 'Vermelho' | 'Verde' | 'Azul';

export interface Color {
  name: string;
  hex: number;
}

export const DEFAULT_PALETTES: Map<
  PaletteName,
  FixedLengthArray<Color, 6>
> = new Map();

DEFAULT_PALETTES.set('Vermelho', [
  { name: 'Vermelho sangue', hex: 0x6f0404 },
  { name: 'Vermelho escuro', hex: 0x7c0404 },
  { name: 'Vermelho sangue (2)', hex: 0x880303 },
  { name: 'Vermelho escuro (2)', hex: 0x910202 },
  { name: 'Vermelho carmesin', hex: 0x940303 },
  { name: 'Vermelho ruivo', hex: 0xa00202 },
]);

DEFAULT_PALETTES.set('Verde', [
  { name: 'Verde MSU', hex: 0x1b4332 },
  { name: 'Verde amazônia', hex: 0x2d6a4f },
  { name: 'Verde esmeralda', hex: 0x40916c },
  { name: 'Verde menta', hex: 0x52b788 },
  { name: 'Verde oceano', hex: 0x74c69d },
  { name: 'Verde turquesa', hex: 0x95d5b2 },
]);

DEFAULT_PALETTES.set('Azul', [
  { name: 'Azul meia-noite', hex: 0x023e8a },
  { name: 'Azul estelar', hex: 0x0077b6 },
  { name: 'Azul elétrico', hex: 0x0096c7 },
  { name: 'Azul pacifico', hex: 0x00b4d8 },
  { name: 'Azul céu', hex: 0x48cae4 },
  { name: 'Azul médio', hex: 0x90e0ef },
]);
