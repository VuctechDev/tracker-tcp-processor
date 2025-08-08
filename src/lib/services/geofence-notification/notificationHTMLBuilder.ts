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
  },
};

export function notificationHTMLBuilder(
  deviceName: string,
  direction: string,
  lang: keyof typeof translations
): { subject: string; html: string } {
  const t = translations[lang] ?? translations.en;
  const now = new Date().toLocaleString("en-GB", {
    hour12: false,
    timeZone: "UTC",
  });

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
      </div>
    `;

  return { subject, html };
}
