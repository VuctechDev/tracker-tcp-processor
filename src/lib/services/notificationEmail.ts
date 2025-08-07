import db from "../../db";

export const sendEmail = async (deviceId: string, direction: string) => {
  const device = await db.devices.getByIMEI(deviceId);
  if (!device?.organization?.email) {
    return;
  }
  const API_KEY = process.env.EMAILER_API_KEY ?? "";
  const r = await fetch(`https://emailer.pikado.net/emailer/send`, {
    headers: {
      "Content-Type": "application/json",
      apikey: API_KEY,
    },
    method: "POST",
    body: JSON.stringify({
      from: "Geofence Incident <info@pikado.net>",
      to: device?.organization?.email,
      subject: `${device?.name} Device - Geofence Violation Detected`,
      html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #d32f2f;">Geofence Alert</h2>
            <p>
              The device <strong>${
                device?.name
              }</strong> has <strong>exited the defined geofence</strong>.
            </p>
            <p>
              <strong>Direction:</strong> ${
                direction.charAt(0).toUpperCase() + direction.slice(1)
              }<br />
              <strong>Time:</strong> ${new Date().toLocaleString("en-GB", {
                hour12: false,
                timeZone: "UTC",
              })} UTC
            </p>
            <p style="margin-top: 20px;">
              Please check the tracking dashboard to obtain more information.
            </p>
          </div>
        `,
    }),
  });
  const d = await r.json();
  console.log(
    `[✅ EMAIL] to ${device?.organization?.email} - ${JSON.stringify(d)} ${
      r.status
    }`
  );
};
