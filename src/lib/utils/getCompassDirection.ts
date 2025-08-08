export const getCompassDirection = (
  bearing: number,
  lang: "en" | "sr" | "sl" | "de" = "en"
): string => {
  const translations: Record<string, string[]> = {
    en: [
      "North",
      "Northeast",
      "East",
      "Southeast",
      "South",
      "Southwest",
      "West",
      "Northwest",
    ],
    sr: [
      "Sjever",
      "Sjeveroistok",
      "Istok",
      "Jugoistok",
      "Jug",
      "Jugozapad",
      "Zapad",
      "Sjverozapad",
    ],
    sl: [
      "Sever",
      "Severovzhod",
      "Vzhod",
      "Jugovzhod",
      "Jug",
      "Jugozahod",
      "Zahod",
      "Severozahod",
    ],
    de: [
      "Norden",
      "Nordosten",
      "Osten",
      "Südosten",
      "Süden",
      "Südwesten",
      "Westen",
      "Nordwesten",
    ],
  };

  const directions = translations[lang] || translations.en;
  const index = Math.round(((bearing + 360) % 360) / 45) % 8;
  return directions[index];
};