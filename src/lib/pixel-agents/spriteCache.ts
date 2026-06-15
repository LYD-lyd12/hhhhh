import type { SpriteData } from './types';

const zoomCaches = new Map<number, Map<string, HTMLCanvasElement>>();

function spriteHash(sprite: SpriteData): string {
  let h = 0;
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const v = sprite[r][c];
      for (let i = 0; i < v.length; i++) {
        h = (h * 31 + v.charCodeAt(i)) | 0;
      }
    }
  }
  return String(h);
}

export function getCachedSprite(sprite: SpriteData, zoom: number): HTMLCanvasElement {
  let cache = zoomCaches.get(zoom);
  if (!cache) {
    cache = new Map();
    zoomCaches.set(zoom, cache);
  }

  const key = spriteHash(sprite);
  const cached = cache.get(key);
  if (cached) return cached;

  const rows = sprite.length;
  const cols = sprite[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = cols * zoom;
  canvas.height = rows * zoom;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = sprite[r][c];
      if (color === '') continue;
      ctx.fillStyle = color;
      ctx.fillRect(c * zoom, r * zoom, zoom, zoom);
    }
  }

  cache.set(key, canvas);
  return canvas;
}

function flipSpriteHorizontal(sprite: SpriteData): SpriteData {
  return sprite.map((row) => [...row].reverse());
}

export { flipSpriteHorizontal };
