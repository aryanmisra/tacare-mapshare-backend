require("dotenv").config();
/*

Please contact us for credentials to access database.

*/
export const PORT = process.env.PORT ? process.env.PORT : 5000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const URL = process.env.ENVIRONMENT === "production" ? "https://tacare-api.herokuapp.com" : "http://localhost:5000";
export const EMAIL_KEY = process.env.EMAIL_KEY; // support email password
export const JWT_KEY = process.env.JWT_KEY ? process.env.JWT_KEY : ""; //jwt secret
export const dsClientId = "779d3164-53fc-47b7-a06f-19aeb52840db";
export const dsClientSecret = "d0a078f5-1f30-4386-af7f-fbe1476597f0";
