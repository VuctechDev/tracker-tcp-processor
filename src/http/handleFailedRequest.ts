const codeMessageMap: Record<number, string> = {
  401: "unauthorizedException",
  404: "notFoundException",
  500: "somethingWentWrong",
};

const time = () =>
  `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;

export const handleFailedRequest = (
  res: any,
  req: any,
  options: { error?: any; code?: number; message?: string } = {
    error: null,
    code: 500,
    message: "",
  }
) => {
  console.log(
    `FAILED REQUEST [${time()}]: ${req.method} : ${req.originalUrl}`, 
    `ERROR: ${JSON.stringify(options.error)}`
  );
  return res.status(options.code).json({
    message: options?.message ?? codeMessageMap[options.code ?? 500],
    success: false,
  });
};
