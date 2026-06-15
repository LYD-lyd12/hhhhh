export const TILE_SIZE = 16;
export const CHAR_FRAME_W = 16;
export const CHAR_FRAME_H = 32;
export const CHAR_FRAMES_PER_ROW = 7;
export const CHARACTER_DIRECTIONS = ['down', 'up', 'right'] as const;
export type CharacterDirection = (typeof CHARACTER_DIRECTIONS)[number];

export const CharacterState = {
  IDLE: 'idle',
  WALK: 'walk',
  TYPE: 'type',
} as const;
export type CharacterState = (typeof CharacterState)[keyof typeof CharacterState];

export const Direction = {
  DOWN: 'down',
  UP: 'up',
  RIGHT: 'right',
  LEFT: 'left',
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

export type SpriteData = string[][];

export interface CharacterSprites {
  walk: Record<Direction, [SpriteData, SpriteData, SpriteData, SpriteData]>;
  typing: Record<Direction, [SpriteData, SpriteData]>;
  reading: Record<Direction, [SpriteData, SpriteData]>;
}

export interface CharacterDirectionSprites {
  down: SpriteData[];
  up: SpriteData[];
  right: SpriteData[];
}
