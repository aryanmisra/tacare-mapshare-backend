import User from "../models/user";

import { tokenAuthenticator } from "../utils/middleware";
import * as config from "../config";
const createError = require("http-errors");
const userRouter = require("express").Router();

userRouter.get("/data", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findById(req.uid).exec();
  if (user) {
    res.json(user);
  } else {
    next(createError(400, "Invalid Request."));
  }
});

// userRouter.get("/resend-verification", tokenAuthenticator, async (req, res, next) => {
//   const user = await User.findOne({ "bitclout.publicKey": req.key });
//   if (user) {
//     const mailBody = emailVerify(user.verification.emailString);
//     sendMail(user.email, mailBody.header, mailBody.body);
//     res.sendStatus(201);
//   } else {
//     next(createError(400, "Invalid Request."));
//   }
// });

// userRouter.put("/update-email", tokenAuthenticator, async (req, res, next) => {
//   const { email } = req.body;
//   const emailCheck = await User.findOne({
//     email: email,
//   }).exec();
//   const user = await User.findOne({ "bitclout.publicKey": req.key });
//   if (user && !emailCheck) {
//     user.email = email.toLowerCase();
//     user.verification.email = false;
//     const email_code = generateCode(8);
//     user.verification.emailString = email_code;
//     user.save((err: any) => {
//       if (err) {
//         next(err);
//       } else {
//         try {
//           const mailBody = emailVerify(email_code);
//           sendMail(email, mailBody.header, mailBody.body);
//           res.sendStatus(201);
//         } catch (err) {
//           next(err);
//         }
//       }
//     });
//   } else {
//     next(createError(400, "Invalid Request."));
//   }
// });

// userRouter.put("/update-name", tokenAuthenticator, async (req, res, next) => {
//   const { name } = req.body;
//   const user = await User.findOne({ "bitclout.publicKey": req.key });
//   if (user && name !== "") {
//     user.name = name;
//     user.save((err: any) => {
//       if (err) {
//         next(err);
//       } else {
//         res.sendStatus(201);
//       }
//     });
//   } else {
//     next(createError(400, "Invalid Request."));
//   }
// });

// userRouter.put("/update-profile", tokenAuthenticator, updateProfileSchema, async (req, res, next) => {
//   const { email, name } = req.body;
//   const emailCheck = await User.findOne({
//     email: email,
//   }).exec();
//   const user = await User.findOne({ "bitclout.publicKey": req.key });
//   if (user && !emailCheck) {
//     user.email = email.toLowerCase();
//     user.name = name !== "" ? name : user.name;
//     user.save((err: any) => {
//       if (err) {
//         next(err);
//       } else {
//         res.sendStatus(201);
//       }
//     });
//   } else {
//     next(createError(400, "Invalid Request."));
//   }
// });

// userRouter.get("/verify-email/:code", async (req, res, next) => {
//   const code = req.params.code;
//   const user = await User.findOne({ "verification.emailString": code }).exec();
//   if (user) {
//     user.verification.email = true;
//     user
//       .save()
//       .then(() => {
//         res.status(200).send(emailverified);
//       })
//       .catch(error => {
//         res.status(500).send(servererror);
//       });
//   } else {
//     next(createError(400, "Invalid Link."));
//   }
// });

export default userRouter;
