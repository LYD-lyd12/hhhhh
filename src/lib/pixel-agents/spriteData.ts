import { decodeCharacterPngFromUrl } from './pngDecoder';
import { flipSpriteHorizontal, getCachedSprite } from './spriteCache';
import {
  CharacterState,
  Direction,
  type CharacterSprites,
  type CharacterDirectionSprites,
  type SpriteData,
} from './types';

let loadedCharacters: CharacterDirectionSprites[] | null = null;
let loadPromise: Promise<void> | null = null;
const spriteLoadListeners: Set<() => void> = new Set();

export function onSpritesLoaded(callback: () => void): () => void {
  spriteLoadListeners.add(callback);
  if (loadedCharacters) {
    // 已加载，立即通知
    callback();
  }
  return () => {
    spriteLoadListeners.delete(callback);
  };
}

/** 异步加载所有角色 PNG 精灵图 */
export async function loadCharacterSprites(): Promise<void> {
  if (loadedCharacters) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const charUrls = [
      '/assets/characters/char_0.png',
      '/assets/characters/char_1.png',
      '/assets/characters/char_2.png',
      '/assets/characters/char_3.png',
      '/assets/characters/char_4.png',
      '/assets/characters/char_5.png',
    ];

    const results = await Promise.all(
      charUrls.map((url) =>
        decodeCharacterPngFromUrl(url).catch((err) => {
          console.warn(`加载角色精灵图失败: ${url}`, err);
          return { down: [], up: [], right: [] } as CharacterDirectionSprites;
        }),
      ),
    );
    loadedCharacters = results;
    // 通知所有监听器精灵图已加载
    spriteLoadListeners.forEach((cb) => cb());
  })();

  return loadPromise;
}

export function getLoadedCharacterCount(): number {
  return loadedCharacters ? loadedCharacters.length : 0;
}

function emptySprite(w: number, h: number): SpriteData {
  const rows: string[][] = [];
  for (let y = 0; y < h; y++) {
    rows.push(new Array(w).fill(''));
  }
  return rows;
}

export function getCharacterSprites(paletteIndex: number): CharacterSprites {
  if (!loadedCharacters) {
    const e = emptySprite(16, 32);
    const walkSet: [SpriteData, SpriteData, SpriteData, SpriteData] = [e, e, e, e];
    const pairSet: [SpriteData, SpriteData] = [e, e];
    return {
      walk: { down: walkSet, up: walkSet, right: walkSet, left: walkSet },
      typing: { down: pairSet, up: pairSet, right: pairSet, left: pairSet },
      reading: { down: pairSet, up: pairSet, right: pairSet, left: pairSet },
    };
  }

  const char = loadedCharacters[paletteIndex % loadedCharacters.length];
  const d = char.down;
  const u = char.up;
  const rt = char.right;
  const flip = flipSpriteHorizontal;

  return {
    walk: {
      [Direction.DOWN]: d.length >= 3 ? [d[0], d[1], d[2], d[1]] : [emptySprite(16, 32), emptySprite(16, 32), emptySprite(16, 32), emptySprite(16, 32)],
      [Direction.UP]: u.length >= 3 ? [u[0], u[1], u[2], u[1]] : [emptySprite(16, 32), emptySprite(16, 32), emptySprite(16, 32), emptySprite(16, 32)],
      [Direction.RIGHT]: rt.length >= 3 ? [rt[0], rt[1], rt[2], rt[1]] : [emptySprite(16, 32), emptySprite(16, 32), emptySprite(16, 32), emptySprite(16, 32)],
      [Direction.LEFT]: rt.length >= 3 ? [flip(rt[0]), flip(rt[1]), flip(rt[2]), flip(rt[1])] : [emptySprite(16, 32), emptySprite(16, 32), emptySprite(16, 32), emptySprite(16, 32)],
    },
    typing: {
      [Direction.DOWN]: d.length >= 5 ? [d[3], d[4]] : [emptySprite(16, 32), emptySprite(16, 32)],
      [Direction.UP]: u.length >= 5 ? [u[3], u[4]] : [emptySprite(16, 32), emptySprite(16, 32)],
      [Direction.RIGHT]: rt.length >= 5 ? [rt[3], rt[4]] : [emptySprite(16, 32), emptySprite(16, 32)],
      [Direction.LEFT]: rt.length >= 5 ? [flip(rt[3]), flip(rt[4])] : [emptySprite(16, 32), emptySprite(16, 32)],
    },
    reading: {
      [Direction.DOWN]: d.length >= 7 ? [d[5], d[6]] : [emptySprite(16, 32), emptySprite(16, 32)],
      [Direction.UP]: u.length >= 7 ? [u[5], u[6]] : [emptySprite(16, 32), emptySprite(16, 32)],
      [Direction.RIGHT]: rt.length >= 7 ? [rt[5], rt[6]] : [emptySprite(16, 32), emptySprite(16, 32)],
      [Direction.LEFT]: rt.length >= 7 ? [flip(rt[5]), flip(rt[6])] : [emptySprite(16, 32), emptySprite(16, 32)],
    },
  };
}

/** 根据当前状态获取要渲染的 sprite 帧 */
export function getCharacterSprite(
  state: CharacterState,
  direction: Direction,
  frame: number,
  sprites: CharacterSprites,
): SpriteData {
  switch (state) {
    case CharacterState.TYPE:
      return sprites.typing[direction][frame % 2];
    case CharacterState.WALK:
      return sprites.walk[direction][frame % 4];
    case CharacterState.IDLE:
    default:
      return sprites.walk[direction][1];
  }
}

export { getCachedSprite };
