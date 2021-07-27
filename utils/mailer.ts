const nodemailer = require("nodemailer");
import * as config from "../config";
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
    } else {
      return info.response;
    }
  });
}

export default sendMail;
