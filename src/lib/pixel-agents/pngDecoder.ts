import {
  CHAR_FRAME_H,
  CHAR_FRAME_W,
  CHAR_FRAMES_PER_ROW,
  CHARACTER_DIRECTIONS,
  type CharacterDirectionSprites,
  type SpriteData,
} from './types';

function rgbaToHex(r: number, g: number, b: number, a: number): string {
  if (a === 0) return '';
  const hex =
    '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0');
  if (a < 255) {
    return hex + a.toString(16).padStart(2, '0');
  }
  return hex.toUpperCase();
}

/**
 * 浏览器端：通过 Canvas 解码 PNG 图像素数据。
 * PNG 尺寸 112×96 = 3 行（down/up/right）× 7 帧（每帧 16×32）
 */
export async function decodeCharacterPngFromUrl(
  url: string,
): Promise<CharacterDirectionSprites> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
  });
  img.src = url;

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建 Canvas 2D 上下文');
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);

  const charData: CharacterDirectionSprites = { down: [], up: [], right: [] };

  for (let dirIdx = 0; dirIdx < CHARACTER_DIRECTIONS.length; dirIdx++) {
    const dir = CHARACTER_DIRECTIONS[dirIdx];
    const rowOffsetY = dirIdx * CHAR_FRAME_H;
    const frames: SpriteData[] = [];

    for (let f = 0; f < CHAR_FRAMES_PER_ROW; f++) {
      const frameOffsetX = f * CHAR_FRAME_W;
      const imageData = ctx.getImageData(frameOffsetX, rowOffsetY, CHAR_FRAME_W, CHAR_FRAME_H);
      const sprite: SpriteData = [];

      for (let y = 0; y < CHAR_FRAME_H; y++) {
        const row: string[] = [];
        for (let x = 0; x < CHAR_FRAME_W; x++) {
          const idx = (y * CHAR_FRAME_W + x) * 4;
          const r = imageData.data[idx];
          const g = imageData.data[idx + 1];
          const b = imageData.data[idx + 2];
          const a = imageData.data[idx + 3];
          row.push(rgbaToHex(r, g, b, a));
        }
        sprite.push(row);
      }
      frames.push(sprite);
    }
    charData[dir] = frames;
  }

  return charData;
}
