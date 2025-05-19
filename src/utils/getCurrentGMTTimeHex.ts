export function getCurrentGMTTimeHex(): string {
  const now = new Date();
  const year = (now.getUTCFullYear() % 100).toString(16).padStart(2, "0");
  const month = (now.getUTCMonth() + 1).toString(16).padStart(2, "0");
  const day = now.getUTCDate().toString(16).padStart(2, "0");
  const hour = now.getUTCHours().toString(16).padStart(2, "0");
  const minute = now.getUTCMinutes().toString(16).padStart(2, "0");
  const second = now.getUTCSeconds().toString(16).padStart(2, "0");
  return year + month + day + hour + minute + second;
}
