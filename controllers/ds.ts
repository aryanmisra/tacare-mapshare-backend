const dsRouter = require("express").Router();
const commonControllers = require("../lib/commonControllers");

function dsLoginCB1(req, res, next) {
  req.dsAuthCodeGrant.oauth_callback1(req, res, next);
}
function dsLoginCB2(req, res, next) {
  req.dsAuthCodeGrant.oauth_callback2(req, res, next);
}

dsRouter
  .get("/", commonControllers.indexController)
  .get("/ds/login", (req, res, next) => {
    req.dsAuthCodeGrant.login(req, res, next);
  })
  .get("/ds/callback", [dsLoginCB1, dsLoginCB2]) // OAuth callbacks. See below
  .get("/ds/logout", (req, res) => {
    req.dsAuthCodeGrant.logout(req, res);
  })
  .get("/ds/logoutCallback", (req, res) => {
    req.dsAuthCodeGrant.logoutCallback(req, res);
  })
  .get("/ds/mustAuthenticate", commonControllers.mustAuthenticateController)
  .get("/ds-return", commonControllers.returnController);

export default dsRouter;
