export function getCurrentGMTTimeHex(): string {
  const now = new Date();

  const year = now.getUTCFullYear() % 100; // e.g. 2025 → 25
  const month = now.getUTCMonth() + 1; // getUTCMonth is zero-based
  const day = now.getUTCDate();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const second = now.getUTCSeconds();

  const toHex = (val: number) => val.toString().padStart(2, "0");

  return (
    toHex(year) +
    toHex(month) +
    toHex(day) +
    toHex(hour) +
    toHex(minute) +
    toHex(second)
  );
}
