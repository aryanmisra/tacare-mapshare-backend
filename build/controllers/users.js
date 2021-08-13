"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../models/user"));
const middleware_1 = require("../utils/middleware");
const createError = require("http-errors");
const userRouter = require("express").Router();
userRouter.get("/data", middleware_1.tokenAuthenticator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.uid).exec();
    if (user) {
        res.json(user);
    }
    else {
        next(createError(400, "Invalid Request."));
    }
}));
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
exports.default = userRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9jb250cm9sbGVycy91c2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLDBEQUFrQztBQUVsQyxvREFBeUQ7QUFFekQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUUvQyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSwrQkFBa0IsRUFBRSxDQUFPLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDbkUsTUFBTSxJQUFJLEdBQUcsTUFBTSxjQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNqRCxJQUFJLElBQUksRUFBRTtRQUNSLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDaEI7U0FBTTtRQUNMLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQztLQUM1QztBQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7QUFFSCx5RkFBeUY7QUFDekYsd0VBQXdFO0FBQ3hFLGdCQUFnQjtBQUNoQixtRUFBbUU7QUFDbkUsNERBQTREO0FBQzVELDJCQUEyQjtBQUMzQixhQUFhO0FBQ2Isa0RBQWtEO0FBQ2xELE1BQU07QUFDTixNQUFNO0FBRU4sa0ZBQWtGO0FBQ2xGLGdDQUFnQztBQUNoQyw0Q0FBNEM7QUFDNUMsb0JBQW9CO0FBQ3BCLGVBQWU7QUFDZix3RUFBd0U7QUFDeEUsK0JBQStCO0FBQy9CLHdDQUF3QztBQUN4Qyx1Q0FBdUM7QUFDdkMsMENBQTBDO0FBQzFDLGtEQUFrRDtBQUNsRCxnQ0FBZ0M7QUFDaEMsbUJBQW1CO0FBQ25CLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakIsZ0JBQWdCO0FBQ2hCLHNEQUFzRDtBQUN0RCw2REFBNkQ7QUFDN0QsaUNBQWlDO0FBQ2pDLDBCQUEwQjtBQUMxQix1QkFBdUI7QUFDdkIsWUFBWTtBQUNaLFVBQVU7QUFDVixVQUFVO0FBQ1YsYUFBYTtBQUNiLGtEQUFrRDtBQUNsRCxNQUFNO0FBQ04sTUFBTTtBQUVOLGlGQUFpRjtBQUNqRiwrQkFBK0I7QUFDL0Isd0VBQXdFO0FBQ3hFLCtCQUErQjtBQUMvQix3QkFBd0I7QUFDeEIsZ0NBQWdDO0FBQ2hDLG1CQUFtQjtBQUNuQixxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCLCtCQUErQjtBQUMvQixVQUFVO0FBQ1YsVUFBVTtBQUNWLGFBQWE7QUFDYixrREFBa0Q7QUFDbEQsTUFBTTtBQUNOLE1BQU07QUFFTix5R0FBeUc7QUFDekcsc0NBQXNDO0FBQ3RDLDRDQUE0QztBQUM1QyxvQkFBb0I7QUFDcEIsZUFBZTtBQUNmLHdFQUF3RTtBQUN4RSwrQkFBK0I7QUFDL0Isd0NBQXdDO0FBQ3hDLGtEQUFrRDtBQUNsRCxnQ0FBZ0M7QUFDaEMsbUJBQW1CO0FBQ25CLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakIsK0JBQStCO0FBQy9CLFVBQVU7QUFDVixVQUFVO0FBQ1YsYUFBYTtBQUNiLGtEQUFrRDtBQUNsRCxNQUFNO0FBQ04sTUFBTTtBQUVOLG9FQUFvRTtBQUNwRSxrQ0FBa0M7QUFDbEMsa0ZBQWtGO0FBQ2xGLGdCQUFnQjtBQUNoQixzQ0FBc0M7QUFDdEMsV0FBVztBQUNYLGdCQUFnQjtBQUNoQixzQkFBc0I7QUFDdEIsK0NBQStDO0FBQy9DLFdBQVc7QUFDWCwwQkFBMEI7QUFDMUIsNkNBQTZDO0FBQzdDLFlBQVk7QUFDWixhQUFhO0FBQ2IsK0NBQStDO0FBQy9DLE1BQU07QUFDTixNQUFNO0FBRU4sa0JBQWUsVUFBVSxDQUFDIn0=