"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require("nodemailer");
const config = __importStar(require("../config"));
const mail = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "tacare.mapshare@gmail.com",
        pass: config.EMAIL_KEY,
    },
});
function sendMail(toEmail, subject, html) {
    const mailOptions = {
        from: "tacare.mapshare@gmail.com",
        to: toEmail,
        subject: subject,
        html: html,
    };
    mail.sendMail(mailOptions, function (error, info) {
        if (error) {
            throw error;
        }
        else {
            return info.response;
        }
    });
}
exports.default = sendMail;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdXRpbHMvbWFpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN6QyxrREFBb0M7QUFDcEMsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQztJQUN0QyxPQUFPLEVBQUUsT0FBTztJQUNoQixJQUFJLEVBQUU7UUFDSixJQUFJLEVBQUUsMkJBQTJCO1FBQ2pDLElBQUksRUFBRSxNQUFNLENBQUMsU0FBUztLQUN2QjtDQUNGLENBQUMsQ0FBQztBQUVILFNBQVMsUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSTtJQUN0QyxNQUFNLFdBQVcsR0FBRztRQUNsQixJQUFJLEVBQUUsMkJBQTJCO1FBQ2pDLEVBQUUsRUFBRSxPQUFPO1FBQ1gsT0FBTyxFQUFFLE9BQU87UUFDaEIsSUFBSSxFQUFFLElBQUk7S0FDWCxDQUFDO0lBQ0YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsVUFBVSxLQUFLLEVBQUUsSUFBSTtRQUM5QyxJQUFJLEtBQUssRUFBRTtZQUNULE1BQU0sS0FBSyxDQUFDO1NBQ2I7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztTQUN0QjtJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELGtCQUFlLFFBQVEsQ0FBQyJ9