import { redis } from ".";

const get = async (deviceId: string) => {
  const now = Date.now();
  const lastNotifKey = `device:${deviceId}:lastNotif`;
  const lastNotif = await redis.get(lastNotifKey);
  if (!lastNotif) {
    return { lastNotif, expired: false };
  }

  const notifStaleTime = parseInt(process.env.STALE_NOTIFICATION_TIME ?? "60");
  const expired = now - parseInt(lastNotif) >= notifStaleTime * 60 * 1000;
  return { lastNotif, expired };
};

const insert = async (deviceId: string) => {
  const now = Date.now();
  const lastNotifKey = `device:${deviceId}:lastNotif`;

  try {
    await redis.set(lastNotifKey, now.toString(), { EX: 3700 });
    console.log(`[✅ REDIS] Wrote notification for ${deviceId}`);
  } catch (err) {
    console.error(
      `[❌ REDIS ERROR] Failed to write notification for ${deviceId}:`,
      err
    );
  }
};

export { get, insert };
