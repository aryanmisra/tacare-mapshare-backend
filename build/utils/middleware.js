"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.dsCodeGrant =
  exports.dsHandler =
  exports.tokenAuthenticator =
  exports.errorHandler =
  exports.unknownEndpoint =
  exports.requestLogger =
  exports.loginSchema =
  exports.registerSchema =
    void 0;
const joi_1 = __importDefault(require("joi"));
const config = __importStar(require("../config"));
const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const dsConfig = require("../dsconfig.js");
const DSAuthCodeGrant = require("../lib/DSAuthCodeGrant");
// export const updateProfileSchema = (req, res, next) => {
//   const schema = Joi.object({
//     email: Joi.string().email().required(),
//     firstName: Joi.string().required(),
//   });
//   validateRequest(req, next, schema);
// };
const registerSchema = (req, res, next) => {
  const schema = joi_1.default.object({
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    userType: joi_1.default.string().required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
  });
  validateRequest(req, next, schema);
};
exports.registerSchema = registerSchema;
const loginSchema = (req, res, next) => {
  const schema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
  });
  validateRequest(req, next, schema);
};
exports.loginSchema = loginSchema;
const validateRequest = (req, next, schema) => {
  const options = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true, // remove unknown props
  };
  const { error, value } = schema.validate(req.body, options);
  if (error) {
    next(createError(400, `Validation Error`));
  } else {
    req.body = value;
    next();
  }
};
const requestLogger = (req, res, next) => {
  console.log("Method:", req.method);
  console.log("Path:  ", req.path);
  console.log("Header:  ", req.header);
  console.log("Body:  ", req.body);
  console.log("---");
  next();
};
exports.requestLogger = requestLogger;
const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: "unknown endpoint" });
};
exports.unknownEndpoint = unknownEndpoint;
const errorHandler = (error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    next(error);
  }
  res.status(error.status || 500);
  res.json({
    status: error.status,
    message: error.message,
  });
};
exports.errorHandler = errorHandler;
const tokenAuthenticator = (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (token == null) return res.status(400).send("Missing token");
  jwt.verify(token, config.JWT_KEY, (err, key) =>
    __awaiter(void 0, void 0, void 0, function* () {
      if (err) return res.status(403).send("Invalid token");
      req.uid = key.uid;
      next();
    })
  );
};
exports.tokenAuthenticator = tokenAuthenticator;
const dsHandler = (req, res, next) => {
  res.locals.user = req.user;
  res.locals.session = req.session;
  res.locals.dsConfig = dsConfig;
  res.locals.hostUrl = config.URL; // Used by DSAuthCodeGrant#logout
  console.log(req.user, req.session);
  next();
};
exports.dsHandler = dsHandler;
const dsCodeGrant = (req, res, next) => {
  req.dsAuthCodeGrant = new DSAuthCodeGrant(req);
  next();
};
exports.dsCodeGrant = dsCodeGrant;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3V0aWxzL21pZGRsZXdhcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDhDQUFzQjtBQUN0QixrREFBb0M7QUFDcEMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3BDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUUzQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtBQUMxQyxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQTtBQUV6RCwyREFBMkQ7QUFDM0QsZ0NBQWdDO0FBQ2hDLDhDQUE4QztBQUM5QywwQ0FBMEM7QUFFMUMsUUFBUTtBQUNSLHdDQUF3QztBQUN4QyxLQUFLO0FBRUUsTUFBTSxjQUFjLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO0lBQy9DLE1BQU0sTUFBTSxHQUFHLGFBQUcsQ0FBQyxNQUFNLENBQUM7UUFDeEIsU0FBUyxFQUFFLGFBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7UUFDbEMsUUFBUSxFQUFFLGFBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7UUFDakMsUUFBUSxFQUFFLGFBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7UUFDakMsS0FBSyxFQUFFLGFBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUU7UUFDdEMsUUFBUSxFQUFFLGFBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7S0FDbEMsQ0FBQyxDQUFDO0lBQ0gsZUFBZSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFD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
