import { decodeAccessToken } from "../lib/jwt";
import { handleFailedRequest } from "./handleFailedRequest";

export const authGuard = (req: any, res: any, next: () => void) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return handleFailedRequest(res, req, {
        code: 401,
        message: "no token",
      });
    }
    const user = decodeAccessToken(token) as any;
    req.headers.userId = user?.id;
    req.headers.organizationId = user?.organizationId;

    next();
  } catch (error) {
    return handleFailedRequest(res, req, {
      code: 401,
      message: "token issue",
    });
  }
};
