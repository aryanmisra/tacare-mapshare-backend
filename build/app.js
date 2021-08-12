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
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
// Imports
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose = require("mongoose");
const morgan_1 = __importDefault(require("morgan"));
const morgan_body_1 = __importDefault(require("morgan-body"));
const session = require("express-session");
const path_1 = __importDefault(require("path"));
const passport_1 = __importDefault(require("passport"));
const DocusignStrategy = require("passport-docusign");
const csurf_1 = __importDefault(require("csurf"));
const moment_1 = __importDefault(require("moment"));
const express_flash_1 = __importDefault(require("express-flash"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const MemoryStore = require("memorystore")(session);
const helmet_csp_1 = __importDefault(require("helmet-csp"));
const body_parser_1 = __importDefault(require("body-parser"));
// Routers
const users_1 = __importDefault(require("./controllers/users"));
const auth_1 = __importDefault(require("./controllers/auth"));
const branch_1 = __importDefault(require("./controllers/branch"));
const ds_1 = __importDefault(require("./controllers/ds"));
// Middleware
const middleware = __importStar(require("./utils/middleware"));
const logger = __importStar(require("./utils/logger"));
const config = __importStar(require("./config"));
const dsConfig = require("./dsconfig.js");
const eg002 = require("./lib/examples/eg002");
//Setups
const app = express_1.default();
const HOST = process.env.HOST || "localhost",
  hostUrl = "http://" + HOST + ":" + config.PORT,
  max_session_min = 180,
  csrfProtection = csurf_1.default({ cookie: true });
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
app.use(cors_1.default());
app.options("*", cors_1.default());
// app.use(helmet());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use(cookie_parser_1.default());
app.use(
  session({
    secret: "12345",
    name: "Tacare MapShare",
    cookie: { maxAge: max_session_min * 60000 },
    saveUninitialized: true,
    resave: true,
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  })
);
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(express_1.default.json());
app.use(middleware.dsHandler);
app.use(express_flash_1.default());
app.use(
  helmet_csp_1.default({
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
      ],
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
app.use(morgan_1.default("dev"));
morgan_body_1.default(app, {
  skip: (req, res) => res.statusCode < 400,
});
app.set("views", path_1.default.join(__dirname, "views")).set("view engine", "ejs").use(middleware.dsCodeGrant);
app.use("/user", users_1.default);
app.use("/auth", auth_1.default);
app.use("/branch", branch_1.default);
app.use("/", ds_1.default);
app.get("/eg002", eg002.getController).post("/eg002", eg002.createController);
passport_1.default.serializeUser(function (user, done) {
  done(null, user);
});
passport_1.default.deserializeUser(function (obj, done) {
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
    user.tokenExpirationTimestamp = moment_1.default().add(user.expiresIn, "s"); // The dateTime when the access token will expire
    return done(null, user);
  }
);
if (!dsConfig.allowSilentAuthentication) {
  // See https://stackoverflow.com/a/32877712/64904
  docusignStrategy.authorizationParams = function (options) {
    return { prompt: "login" };
  };
}
passport_1.default.use(docusignStrategy);
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);
exports.default = app;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFVBQVU7QUFDVixzREFBOEI7QUFDOUIsZ0RBQXdCO0FBRXhCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyQyxvREFBNEI7QUFDNUIsOERBQXFDO0FBQ3JDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0FBQzFDLGdEQUF1QjtBQUN2Qix3REFBK0I7QUFDL0IsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQTtBQUNyRCxrREFBd0I7QUFDeEIsb0RBQTJCO0FBQzNCLGtFQUFpQztBQUNqQyxrRUFBd0M7QUFDeEMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQ25ELDREQUE0QjtBQUM1Qiw4REFBcUM7QUFDckMsVUFBVTtBQUNWLGdFQUE2QztBQUM3Qyw4REFBNEM7QUFDNUMsa0VBQWdEO0FBQ2hELDBEQUF1QztBQUN2QyxhQUFhO0FBQ2IsK0RBQWlEO0FBQ2pELHVEQUF5QztBQUN6QyxpREFBbUM7QUFDbkMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0FBQ3pDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO0FBRTdDLFFBQVE7QUFDUixNQUFNLEdBQUcsR0FBd0IsaUJBQU8sRUFBRSxDQUFDO0FBRTNDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLFdBQVcsRUFDeEMsT0FBTyxHQUFHLFNBQVMsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQzlDLGVBQWUsR0FBRyxHQUFHLEVBQ3JCLGNBQWMsR0FBRyxlQUFJLENB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
