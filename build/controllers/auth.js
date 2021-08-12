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
const functions_1 = require("../utils/functions");
const user_1 = __importDefault(require("../models/user"));
const middleware = __importStar(require("../utils/middleware"));
const createError = require("http-errors");
const authRouter = require("express").Router();
authRouter.put("/register", middleware.registerSchema, (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, userType, email, password } = req.body;
    const newUser = new user_1.default({
      firstName: firstName,
      lastName: lastName,
      userType: userType,
      email: email,
    });
    newUser.password = newUser.generateHash(password);
    try {
      yield newUser.save();
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  })
);
authRouter.post("/login", middleware.loginSchema, (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield user_1.default
      .findOne({
        email: email,
      })
      .exec();
    if (user) {
      if (user.validatePassword(password)) {
        const token = functions_1.generateAccessToken(user._id.toString());
        res.json({
          user: user,
          token: token,
        });
      } else {
        next(createError(401, `Invalid Login.`));
      }
    } else {
      next(createError(406, "User does not exist within database."));
    }
  })
);
authRouter.get("/verifytoken", middleware.tokenAuthenticator, (req, res) => {
  res.sendStatus(204);
});
exports.default = authRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2NvbnRyb2xsZXJzL2F1dGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0RBQXlEO0FBQ3pELDBEQUFrQztBQUNsQyxnRUFBa0Q7QUFDbEQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBRTNDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUUvQyxVQUFVLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsY0FBYyxFQUFFLENBQU8sR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUM5RSxNQUFNLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7SUFDcEUsTUFBTSxPQUFPLEdBQUcsSUFBSSxjQUFJLENBQUM7UUFDdkIsU0FBUyxFQUFFLFNBQVM7UUFDcEIsUUFBUSxFQUFFLFFBQVE7UUFDbEIsUUFBUSxFQUFFLFFBQVE7UUFDbEIsS0FBSyxFQUFFLEtBQUs7S0FDYixDQUFDLENBQUM7SUFDSCxPQUFPLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbEQsSUFBSTtRQUNGLE1BQU0sT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3JCLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDckI7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNUO0FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUVILFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBTyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO0lBQ3pFLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztJQUNyQyxNQUFNLElBQUksR0FBRyxNQUFNLGNBQUksQ0FBQyxPQUFPLENBQUM7UUFDOUIsS0FBSyxFQUFFLEtBQUs7S0FDYixDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFFVixJQUFJLElBQUksRUFBRTtRQUNSLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ25DLE1BQU0sS0FBSyxHQUFHLCtCQUFtQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUN2RCxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNQLElBQUksRUFBRSxJQUFJO2dCQUNWLEtBQUssRUFBRSxLQUFLO2FBQ2IsQ0FBQyxDQUFDO1NBQ0o7YUFBTTtZQUNMLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztTQUMxQztLQUNGO1NBQU07UUFDTCxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDLENBQUM7S0FDaEU7QUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO0FBRUgsVUFBVSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsVUFBVSxDQUFDLGtCQUFrQixFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQ3pFLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdEIsQ0FBQyxDQUFDLENBQUM7QUFFSCxrQkFBZSxVQUFVLENBQUMifQ==
