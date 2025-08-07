import { redis } from "..";
import { sendEmail } from "./notificationEmail";

export async function maybeSendNotification(deviceId: string, direction = "") {
  const lastNotifKey = `device:${deviceId}:lastNotif`;
  const now = Date.now();

  const lastNotif = await redis.get(lastNotifKey);
  const notifStaleTime = parseInt(process.env.STALE_NOTIFICATION_TIME ?? "60");

  if (!lastNotif || now - parseInt(lastNotif) >= notifStaleTime * 60 * 1000) {
    await sendEmail(deviceId, direction);
    await redis.set(lastNotifKey, now.toString(), { EX: 3700 });
    return true;
  }

  console.log(
    `[ℹ️ SKIPPED] Notification already sent within the past hour for ${deviceId}`
  );
  return false;
}
