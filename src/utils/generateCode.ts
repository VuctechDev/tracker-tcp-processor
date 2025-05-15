const source = "ABCDEFGHKLMNQXZWYPRSTUV123456789";
export const generateCode = (length: number = 10) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * source.length) || 1;
    code += source[index - 1];
  }
  console.log("New Code: ", code);
  return code;
};
