export const validateConnection = (data: Buffer) => {
  const str = data.toString("utf8").trim();
  const raw = str.slice(str.lastIndexOf("S168#")).trim();

  const notBlack = data.length < 5 || data[0] !== 0x78 || data[1] !== 0x78;
  const notHCS048 = !raw.startsWith("S168#") || !raw.endsWith("$");

  return {
    notBlack,
    notHCS048,
    isValid: !notBlack || !notHCS048,
  };
};
