export function readCoordinates(location: string): number[] | null {
  const parts = location.split(',').map((part) => Number(part.trim()));
  return parts.length === 2 &&
    parts.every(Number.isFinite) &&
    Math.abs(parts[0]) <= 90 &&
    Math.abs(parts[1]) <= 180
    ? parts
    : null;
}
