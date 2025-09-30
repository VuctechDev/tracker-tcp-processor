import db from "../../../db";
import { getCompassDirection } from "../../utils/getCompassDirection";
import { notificationHTMLBuilder } from "./notificationHTMLBuilder";

export const sendNotification = async (deviceId: string, bearing: number) => {
  const device = await db.devices.getByIMEI(deviceId);
  const email = device?.organization?.email;
  const lang = (device?.organization?.lang ?? "en") as
    | "en"
    | "sr"
    | "sl"
    | "de";
  const direction = getCompassDirection(bearing, lang);

  if (!email) return;

  const { subject, html } = notificationHTMLBuilder(
    device.name,
    direction,
    lang
  );

  const API_KEY = process.env.EMAILER_API_KEY ?? "";
  const EMAILER_URL = process.env.EMAILER_URL ?? "";
  const r = await fetch(EMAILER_URL, {
    headers: {
      "Content-Type": "application/json",
      apikey: API_KEY,
    },
    method: "POST",
    body: JSON.stringify({
      from: "ALERT - ePastir <noreply@vuctechdev.online>",
      to: email,
      subject,
      html,
    }),
  });

  const d = await r.json();

  console.log(
    `[✅ EMAIL] to ${device?.organization?.email} - ${JSON.stringify(d)} ${
      r.status
    }`
  );
};
