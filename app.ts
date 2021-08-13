// Imports
import express from "express";
import cors from "cors";
const mongoose = require("mongoose");
import morgan from "morgan";
import morganBody from "morgan-body";
const session = require("express-session");
import path from "path";
import passport from "passport";
const DocusignStrategy = require("passport-docusign");
import moment from "moment";
import flash from "express-flash";
import cookieParser from "cookie-parser";
const MemoryStore = require("memorystore")(session);
import csp from "helmet-csp";
// Routers
import userRouter from "./controllers/users";
import authRouter from "./controllers/auth";
import branchRouter from "./controllers/branch";
import dsRouter from "./controllers/ds";
// Middleware
import * as middleware from "./utils/middleware";
import * as logger from "./utils/logger";
import * as config from "./config";
const dsConfig = require("./dsconfig.js");
const eg001 = require('./lib/examples/eg001')
  , eg002 = require('./lib/examples/eg002')
  , eg003 = require('./lib/examples/eg003')
  , eg004 = require('./lib/examples/eg004')
  , eg005 = require('./lib/examples/eg005')
  , eg006 = require('./lib/examples/eg006')
  , eg007 = require('./lib/examples/eg007')
  , eg008 = require('./lib/examples/eg008')
  , eg009 = require('./lib/examples/eg009')
  , eg010 = require('./lib/examples/eg010')
  , eg011 = require('./lib/examples/eg011')
  , eg012 = require('./lib/examples/eg012')
  , eg013 = require('./lib/examples/eg013')
  , eg014 = require('./lib/examples/eg014');

//Setups
const app: express.Application = express();

const HOST = process.env.HOST || "localhost",
  hostUrl = "http://" + HOST + ":" + config.PORT,
  max_session_min = 180;

mongoose
  .connect(config.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch(error => {
    logger.error("Error connecting to MongoDB:", error.message);
  });

app.use(cors());
app.options("*", cors());
app.use(express.urlencoded({extended: false, limit: "1mb"}));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(
  session({
    secret: "12345",
    name: "Tacare MapShare",
    cookie: {maxAge: max_session_min * 60000},
    saveUninitialized: true,
    resave: true,
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json({limit: "1mb"}));
app.use(middleware.dsHandler);
app.use(flash());
app.use(
  csp({
    // Specify directives as normal.
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: [
        "'self'",
        "https://code.jquery.com",
        "https://cdnjs.cloudflare.com",
        "https://stackpath.bootstrapcdn.com",
        "https://cdn.jsdelivr.net",
        "'sha256-0NW9KKBQYh2Iv0XLsH/B9LSOfn2Z00m55p5eKSUlikE='",
      ], // hash is for inline script for anchor lib on index page.
      styleSrc: ["'self'", "'unsafe-inline'", "https://stackpath.bootstrapcdn.com"],
      imgSrc: ["'self'", "data:"],
      //sandbox: ['allow-forms', 'allow-scripts', 'allow-modals',
      //  'allow-popups', 'allow-same-origin'], // Sandboxing does not allow PDF viewer plugin...
      objectSrc: ["'self'"],
      fontSrc: ["data:"],
      // Don't set the following
    },
    // This module will detect common mistakes in your directives and throw errors
    // if it finds any. To disable this, enable "loose mode".
    reportOnly: false,
    // Set to true if you want to disable CSP on Android where it can be buggy.
  })
);

app.use(morgan("dev"));
morganBody(app, {
  skip: (req, res) => res.statusCode < 400,
});
app.set("views", path.join(__dirname, "views")).set("view engine", "ejs").use(middleware.dsCodeGrant);

app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/branch", branchRouter);
app.use("/", dsRouter);
app.get('/eg001', eg001.getController)
  .post('/eg001', eg001.createController)
app.get("/eg002", eg002.getController).post("/eg002", eg002.createController).get('/eg003', eg003.getController)
  .post('/eg003', eg003.createController)
  .get('/eg004', eg004.getController)
  .post('/eg004', eg004.createController)
  .get('/eg005', eg005.getController)
  .post('/eg005', eg005.createController)
  .get('/eg006', eg006.getController)
  .post('/eg006', eg006.createController)
  .get('/eg007', eg007.getController)
  .post('/eg007', eg007.createController)
  .get('/eg008', eg008.getController)
  .post('/eg008', eg008.createController)
  .get('/eg009', eg009.getController)
  .post('/eg009', eg009.createController)
  .get('/eg010', eg010.getController)
  .post('/eg010', eg010.createController)
  .get('/eg011', eg011.getController)
  .post('/eg011', eg011.createController)
  .get('/eg012', eg012.getController)
  .post('/eg012', eg012.createController)
  .get('/eg013', eg013.getController)
  .post('/eg013', eg013.createController)
  .get('/eg014', eg014.getController)
  .post('/eg014', eg014.createController)

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

const docusignStrategy = new DocusignStrategy(
  {
    production: dsConfig.production,
    clientID: config.dsClientId,
    clientSecret: config.dsClientSecret,
    callbackURL: hostUrl + "/ds/callback",
    state: true, // automatic CSRF protection.
    // See https://github.com/jaredhanson/passport-oauth2/blob/master/lib/state/session.js
  },
  function _processDsResult(accessToken, refreshToken, params, profile, done) {
    // The params arg will be passed additional parameters of the grant.
    // See https://github.com/jaredhanson/passport-oauth2/pull/84
    //
    // Here we're just assigning the tokens to the account object
    // We store the data in DSAuthCodeGrant.getDefaultAccountInfo
    let user = profile;
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.expiresIn = params.expires_in;
    user.tokenExpirationTimestamp = moment().add(user.expiresIn, "s"); // The dateTime when the access token will expire
    return done(null, user);
  }
);
if (!dsConfig.allowSilentAuthentication) {
  // See https://stackoverflow.com/a/32877712/64904
  docusignStrategy.authorizationParams = function (options) {
    return {prompt: "login"};
  };
}
passport.use(docusignStrategy);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);
export default app;
