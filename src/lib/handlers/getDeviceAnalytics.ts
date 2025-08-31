import { redisMethodes } from "../../redis";

export const getDeviceAnalytics = async (deviceId: string) => {
  const { hourEntries, dayEntries, bufferEntries } =
    await redisMethodes.distance.get(deviceId);

  const sum = (arr: string[]) => arr.reduce((acc, d) => acc + parseFloat(d), 0);

  const lastHourKm = sum(hourEntries);
  const last24hKm = sum(dayEntries);
  
  let distance = 0;
  let timestampOfLastToCompleteKm: number | null = null;

  for (let i = bufferEntries.length - 1; i >= 0 && distance < 1000; i--) {
    const entry = JSON.parse(bufferEntries[i]);
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
