import type { ImgHTMLAttributes } from 'react';
import { useGame } from '../game/store';
import { useLuuSrc } from '../recolor';
import type { ColorId } from '../types';

/** るうの絵（おへやに出ている子の色で表示。color を渡せば別の子の色） */
export function LuuImg({ sprite, color, ...rest }: { sprite: string; color?: ColorId } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'color'>) {
  const { s } = useGame();
  const src = useLuuSrc(sprite, color ?? s.pet.color);
  if (!src) return <img {...rest} alt={rest.alt ?? ''} style={{ ...rest.style, visibility: 'hidden' }} />;
  return <img {...rest} alt={rest.alt ?? ''} src={src} />;
}
