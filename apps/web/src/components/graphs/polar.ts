/** A point at an angle and a distance from the centre. The angle is 0 at the top and grows clockwise, as in d3's arcs. */
export function polar(angle: number, radius: number): { x: number; y: number } {
  return { x: radius * Math.sin(angle), y: -radius * Math.cos(angle) };
}

export const TAU = Math.PI * 2;
