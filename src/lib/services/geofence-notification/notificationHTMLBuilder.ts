const translations = {
  en: {
    subject: (deviceName: string) =>
      `${deviceName} Device - Geofence Violation Detected`,
    heading: "Geofence Alert",
    message: (deviceName: string) =>
      `The device <strong>${deviceName}</strong> has <strong>exited the defined geofence</strong>.`,
    direction: "Direction",
    time: "Time",
    footer: "Please check the tracking dashboard to obtain more information.",
    linkLabel: "Go to App",
  },
  sr: {
    subject: (deviceName: string) =>
      `${deviceName} Uređaj - Detektovan prelazak geoograde`,
    heading: "Upozorenje na geoogradu",
    message: (deviceName: string) =>
      `Uređaj <strong>${deviceName}</strong> je <strong>izašao iz definisane geoograde</strong>.`,
    direction: "Pravac",
    time: "Vrijeme",
    footer: "Molimo proverite aplikaciju za više informacija.",
    linkLabel: "Otvori aplikaciju",
  },
  sl: {
    subject: (deviceName: string) =>
      `${deviceName} Naprava - Zaznana kršitev geoograje`,
    heading: "Opozorilo o geoograji",
    message: (deviceName: string) =>
      `Naprava <strong>${deviceName}</strong> je <strong>zapustila določeno geoograjo</strong>.`,
    direction: "Smer",
    time: "Čas",
    footer: "Za več informacij preverite nadzorno ploščo.",
    linkLabel: "Odprite aplikacijo",
  },
  de: {
    subject: (deviceName: string) =>
      `${deviceName} Gerät – Geofence-Verstoß erkannt`,
    heading: "Geofence-Warnung",
    message: (deviceName: string) =>
      `Das Gerät <strong>${deviceName}</strong> hat <strong>den definierten Geofence verlassen</strong>.`,
    direction: "Richtung",
    time: "Zeit",
    footer: "Bitte überprüfen Sie das Dashboard für weitere Informationen.",
    linkLabel: "Zur App",
  },
};

export function notificationHTMLBuilder(
  imei: string,
  deviceName: string,
  direction: string,
  lang: keyof typeof translations
): { subject: string; html: string } {
  const t = translations[lang] ?? translations.en;
  const now = new Date().toLocaleString("en-GB", {
    hour12: false,
    timeZone: "UTC",
  });

  const url = process.env.CLIENT_URL;

  const subject = t.subject(deviceName);

  const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2 style="color: #d32f2f;">${t.heading}</h2>
    <p>${t.message(deviceName)}</p>
    <p>
      <strong>${t.direction}:</strong> ${direction}<br />
      <strong>${t.time}:</strong> ${now} UTC
    </p>
    <p style="margin-top: 20px;">${t.footer}</p>
    ${
      !!url &&
      `
        <a href="${url}?deviceId=${imei}" 
           style="text-decoration: none;">
          <button style="
            background-color: #1976d2;
            color: #fff;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s ease;
          ">
            ${t.linkLabel}
          </button>
        </a>
      `
    }
  </div>

    `;

  return { subject, html };
}
