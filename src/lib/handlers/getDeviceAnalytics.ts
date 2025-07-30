import { redis } from "..";

export const getDeviceAnalytics = async (deviceId: string) => {
  const now = Date.now();

  const oneHourAgo = now - 1000 * 60 * 60;
  const oneDayAgo = now - 1000 * 60 * 60 * 24;

  const zKey = `device:${deviceId}:distances`;
  const listKey = `device:${deviceId}:buffer`;

  const [hourEntries, dayEntries] = await Promise.all([
    redis.zRangeByScore(zKey, oneHourAgo, now),
    redis.zRangeByScore(zKey, oneDayAgo, now),
  ]);

  const sum = (arr: string[]) => arr.reduce((acc, d) => acc + parseFloat(d), 0);

  const lastHourKm = sum(hourEntries);
  const last24hKm = sum(dayEntries);
  const recentRaw = await redis.lRange(listKey, 0, -1);
  let distance = 0;
  let timestampOfLastToCompleteKm: number | null = null;

  for (let i = recentRaw.length - 1; i >= 0 && distance < 1000; i--) {
    const entry = JSON.parse(recentRaw[i]);
    distance += entry.distance;

    if (distance >= 1000 && !timestampOfLastToCompleteKm) {
      timestampOfLastToCompleteKm = entry.timestamp;
    }
  }
  return {
    lastKilometer: distance?.toFixed(1),
    lastKilometerReachedAt: timestampOfLastToCompleteKm,
    lastHour: lastHourKm.toFixed(1),
    last24h: last24hKm.toFixed(1),
  };
};
