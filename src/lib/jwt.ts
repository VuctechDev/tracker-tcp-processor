import jwt, { Secret } from "jsonwebtoken";
import { UserType } from "../db/users";
// require("dotenv/config");

const ACCESS_SECRET = process.env.ACCESS_SECRET as Secret;
const REFRESH_SECRET = process.env.REFRESH_SECRET as Secret;

const generateAccessToken = (user: UserType, role?: string) => {
  // const json = JSON.parse(JSON.stringify(user));

  return jwt.sign(
    {
      id: user?.id,
      organizationId: user?.organizationId,
      role,
    },
    ACCESS_SECRET
    // {
    //   expiresIn: "",
    // }
  );
};

const generateRefreshToken = (user: any) => {
  const json = JSON.parse(JSON.stringify(user));
  return jwt.sign(
    {
      id: json?.id,
      username: json?.username,
      organization: json?.organization,
    },
    REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const decodeAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET);
};
// : Promise<{ accessToken: string; refreshToken: string }>
const validateRefreshToken = async (token: string) => {
  return jwt.verify(token, REFRESH_SECRET, (err: any, user: any) => {
    if (err) {
      throw new Error(err);
    }
    return {
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user),
    };
  });
};

export {
  validateRefreshToken,
  decodeAccessToken,
  generateRefreshToken,
  generateAccessToken,
};
