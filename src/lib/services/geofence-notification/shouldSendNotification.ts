import { redis } from "../..";
import { sendNotification } from "./sendNotification";

export async function shouldSendNotification(deviceId: string, bearing = 0) {
  const lastNotifKey = `device:${deviceId}:lastNotif`;
  const now = Date.now();

  const lastNotif = await redis.get(lastNotifKey);
  const notifStaleTime = parseInt(process.env.STALE_NOTIFICATION_TIME ?? "60");

  if (!lastNotif || now - parseInt(lastNotif) >=  1000) {
    await sendNotification(deviceId, bearing);
    await redis.set(lastNotifKey, now.toString(), { EX: 3700 });
    return true;
  }

  console.log(
    `[ℹ️ SKIPPED] Notification already sent within the past hour for ${deviceId}`
  );
  return false;
}
