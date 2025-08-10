export const getCurrentGMTTime = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    now.getUTCFullYear().toString() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds())
  );
};
