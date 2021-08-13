import * as config from "../config";
import jwt from "jsonwebtoken";
const algorithm = "aes-256-cbc";

export const generateCode = (len: number) => [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");

export const generateAccessToken = (uid: any) => {
  return jwt.sign(uid, config.JWT_KEY, {expiresIn: "24h"});
};
