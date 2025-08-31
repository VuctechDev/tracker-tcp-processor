import { redisMethodes } from "../../../redis";
import { sendNotification } from "./sendNotification";

export const shouldSendNotification = async (deviceId: string, bearing = 0) => {
  const { lastNotif, expired } = await redisMethodes.notification.get(deviceId);

  if (!lastNotif || expired) {
    await sendNotification(deviceId, bearing);
    await redisMethodes.notification.insert(deviceId);
    return true;
  }

  console.log(
    `[ℹ️ SKIPPED] Notification already sent within the past hour for ${deviceId}`
  );
  return false;
};
