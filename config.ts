require("dotenv").config();

export const PORT = process.env.PORT ? process.env.PORT : 5000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const URL =
  process.env.ENVIRONMENT === "production" ? "https://api.bitswap.network/" : "https://bitswap-core-api-staging.herokuapp.com/";
export const EMAIL_KEY = process.env.EMAIL_KEY; // support email password
export const JWT_KEY = process.env.JWT_KEY ? process.env.JWT_KEY : ""; //jwt secret
