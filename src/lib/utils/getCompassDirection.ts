export function getCompassDirection(bearing: number): string {
  const directions = [
    "north",
    "northeast",
    "east",
    "southeast",
    "south",
    "southwest",
    "west",
    "northwest",
  ];
  const index = Math.round(((bearing + 360) % 360) / 45) % 8;
  return directions[index];
}
