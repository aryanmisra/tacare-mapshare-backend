import { generateAccessToken } from "../utils/functions";
import User from "../models/user";
import * as middleware from "../utils/middleware";
const createError = require("http-errors");

const authRouter = require("express").Router();

authRouter.put("/register", middleware.registerSchema, async (req, res, next) => {
  const { firstName, lastName, userType, email, password } = req.body;
  const newUser = new User({
    firstName: firstName,
    lastName: lastName,
    userType: userType,
    email: email,
  });
  newUser.password = newUser.generateHash(password);
  try {
    await newUser.save();
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", middleware.loginSchema, async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({
    email: email,
  }).exec();

  if (user) {
    if (user.validatePassword(password)) {
      const token = generateAccessToken(user._id.toString());
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
});

authRouter.get("/verifytoken", middleware.tokenAuthenticator, (req, res) => {
  res.sendStatus(204);
});

export default authRouter;
