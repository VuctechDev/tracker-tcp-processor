export function getCurrentGMTTimeHex(): string {
  const now = new Date();

  const year = now.getUTCFullYear(); // Full 4-digit year
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const second = now.getUTCSeconds();

  const toHex = (val: number, length: number = 2) =>
    val.toString(16).padStart(length, "0");

  return (
    toHex(year, 4) + // Now using 4-digit hex for year (2 bytes)
    toHex(month) +
    toHex(day) +
    toHex(hour) +
    toHex(minute) +
    toHex(second)
  );
}
