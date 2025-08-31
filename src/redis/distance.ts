import { redis } from ".";

const insert = async (deviceId: string, distance: number) => {
  const timestamp = new Date().getTime();
  const zKey = `device:${deviceId}:distances`;
  const listKey = `device:${deviceId}:buffer`;

  try {
    await redis.zAdd(zKey, [{ score: timestamp, value: distance.toString() }]);
    await redis.expire(zKey, 60 * 60 * 24 + 60);

    await redis.rPush(listKey, JSON.stringify({ distance, timestamp }));
    await redis.lTrim(listKey, -120, -1);
    console.log(`[✅ REDIS] Wrote distance ${distance} for ${deviceId}`);
  } catch (err) {
    console.error(`[❌ REDIS ERROR] Failed to write for ${deviceId}:`, err);
  }
};

const get = async (deviceId: string) => {
  const now = Date.now();

  const oneHourAgo = now - 1000 * 60 * 60;
  const oneDayAgo = now - 1000 * 60 * 60 * 24;

  const zKey = `device:${deviceId}:distances`;
  const listKey = `device:${deviceId}:buffer`;

  const [hourEntries, dayEntries] = await Promise.all([
    redis.zRangeByScore(zKey, oneHourAgo, now),
    redis.zRangeByScore(zKey, oneDayAgo, now),
  ]);

  const bufferEntries = await redis.lRange(listKey, 0, -1);

  return { hourEntries, dayEntries, bufferEntries };
};

export { insert, get };
