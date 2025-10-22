const map: Record<string, string> = {
  "0": "UTC",
  "1": "Europe/London",
  "2": "Europe/Paris",
  "3": "Europe/Moscow",
  "4": "Asia/Dubai",
  "5": "Asia/Karachi",
  "6": "Asia/Dhaka",
  "7": "Asia/Bangkok",
  "8": "Asia/Singapore",
  "9": "Asia/Tokyo",
  "10": "Australia/Sydney",
  "11": "Pacific/Noumea",
  "12": "Pacific/Auckland",
  "-1": "Atlantic/Azores",
  "-2": "America/Noronha",
  "-3": "America/Argentina/Buenos_Aires",
  "-4": "America/Santiago",
  "-5": "America/New_York",
  "-6": "America/Chicago",
  "-7": "America/Denver",
  "-8": "America/Los_Angeles",
  "-9": "America/Anchorage",
  "-10": "Pacific/Honolulu",
};

export const getTZ = (tz: string): string => {
  return map[tz] ?? "Europe/Paris";
};
