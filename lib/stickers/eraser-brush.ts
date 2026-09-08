export type BrushPoint = { x: number; y: number };

/** Restore from the session's transparent base, never from the original background. */
export function paintStickerBrush(
  context: CanvasRenderingContext2D,
  base: HTMLCanvasElement,
  from: BrushPoint,
  to: BrushPoint,
  radius: number,
  restore: boolean,
) {
  const steps = Math.max(
    1,
    Math.ceil(
      Math.hypot(to.x - from.x, to.y - from.y) / Math.max(1, radius / 3),
    ),
  );
  context.save();
  context.beginPath();
  for (let step = 0; step <= steps; step++) {
    const x = from.x + ((to.x - from.x) * step) / steps;
    const y = from.y + ((to.y - from.y) * step) / steps;
    context.moveTo(x + radius, y);
    context.arc(x, y, radius, 0, Math.PI * 2);
  }
  context.clip();
  context.clearRect(0, 0, base.width, base.height);
  if (restore) context.drawImage(base, 0, 0);
  context.restore();
}
