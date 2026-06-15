import { useEffect, useRef, useState } from 'react';

import { getCachedSprite, getCharacterSprite, getCharacterSprites, onSpritesLoaded } from '@/lib/pixel-agents/spriteData';
import { CharacterState, Direction } from '@/lib/pixel-agents/types';

export interface PixelAgentProps {
  paletteIndex?: number;
  state?: CharacterState;
  direction?: Direction;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  /** 坐下时的垂直偏移（让角色看起来坐在椅子上） */
  sittingOffset?: number;
}

const TYPE_FRAME_DURATION_MS = 300;
const WALK_FRAME_DURATION_MS = 180;

export default function PixelAgent({
  paletteIndex = 0,
  state = CharacterState.TYPE,
  direction = Direction.DOWN,
  zoom = 2,
  className,
  style,
  sittingOffset = 0,
}: PixelAgentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef(0);
  const frameTimerRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [spritesReady, setSpritesReady] = useState(false);

  // 监听精灵图加载完成
  useEffect(() => {
    const cleanup = onSpritesLoaded(() => {
      setSpritesReady(true);
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sprites = getCharacterSprites(paletteIndex);

    const SPRITE_W = 16 * zoom;
    const SPRITE_H = 32 * zoom;
    canvas.width = SPRITE_W;
    canvas.height = SPRITE_H;

    const draw = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      const frameDuration =
        state === CharacterState.WALK ? WALK_FRAME_DURATION_MS : TYPE_FRAME_DURATION_MS;
      frameTimerRef.current += dt;
      if (frameTimerRef.current >= frameDuration) {
        frameTimerRef.current = 0;
        frameRef.current += 1;
      }

      const spriteData = getCharacterSprite(
        state,
        direction,
        frameRef.current,
        sprites,
      );
      const cached = getCachedSprite(spriteData, zoom);

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, SPRITE_W, SPRITE_H);
      ctx.drawImage(cached, 0, sittingOffset * zoom);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [paletteIndex, state, direction, zoom, sittingOffset, spritesReady]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        imageRendering: 'pixelated',
        display: 'block',
        ...style,
      }}
    />
  );
}

export { CharacterState, Direction };
