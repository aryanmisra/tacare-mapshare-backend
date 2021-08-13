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
const moment_1 = __importDefault(require("moment"));
const express_flash_1 = __importDefault(require("express-flash"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const MemoryStore = require("memorystore")(session);
const helmet_csp_1 = __importDefault(require("helmet-csp"));
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
const eg001 = require("./lib/examples/eg001"),
  eg002 = require("./lib/examples/eg002"),
  eg003 = require("./lib/examples/eg003"),
  eg004 = require("./lib/examples/eg004"),
  eg005 = require("./lib/examples/eg005"),
  eg006 = require("./lib/examples/eg006"),
  eg007 = require("./lib/examples/eg007"),
  eg008 = require("./lib/examples/eg008"),
  eg009 = require("./lib/examples/eg009"),
  eg010 = require("./lib/examples/eg010"),
  eg011 = require("./lib/examples/eg011"),
  eg012 = require("./lib/examples/eg012"),
  eg013 = require("./lib/examples/eg013"),
  eg014 = require("./lib/examples/eg014");
//Setups
const app = express_1.default();
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
app.use(cors_1.default());
app.options("*", cors_1.default());
app.use(express_1.default.urlencoded({ extended: false, limit: "1mb" }));
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
app.use(express_1.default.json({ limit: "1mb" }));
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
app.get("/eg001", eg001.getController).post("/eg001", eg001.createController);
app
  .get("/eg002/:id", eg002.getController)
  .post("/eg002", eg002.createController)
  .get("/eg003", eg003.getController)
  .post("/eg003", eg003.createController)
  .get("/eg004", eg004.getController)
  .post("/eg004", eg004.createController)
  .get("/eg005", eg005.getController)
  .post("/eg005", eg005.createController)
  .get("/eg006", eg006.getController)
  .post("/eg006", eg006.createController)
  .get("/eg007", eg007.getController)
  .post("/eg007", eg007.createController)
  .get("/eg008", eg008.getController)
  .post("/eg008", eg008.createController)
  .get("/eg009", eg009.getController)
  .post("/eg009", eg009.createController)
  .get("/eg010", eg010.getController)
  .post("/eg010", eg010.createController)
  .get("/eg011", eg011.getController)
  .post("/eg011", eg011.createController)
  .get("/eg012", eg012.getController)
  .post("/eg012", eg012.createController)
  .get("/eg013", eg013.getController)
  .post("/eg013", eg013.createController)
  .get("/eg014", eg014.getController)
  .post("/eg014", eg014.createController);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFVBQVU7QUFDVixzREFBOEI7QUFDOUIsZ0RBQXdCO0FBQ3hCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyQyxvREFBNEI7QUFDNUIsOERBQXFDO0FBQ3JDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQzNDLGdEQUF3QjtBQUN4Qix3REFBZ0M7QUFDaEMsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUN0RCxvREFBNEI7QUFDNUIsa0VBQWtDO0FBQ2xDLGtFQUF5QztBQUN6QyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEQsNERBQTZCO0FBQzdCLFVBQVU7QUFDVixnRUFBNkM7QUFDN0MsOERBQTRDO0FBQzVDLGtFQUFnRDtBQUNoRCwwREFBd0M7QUFDeEMsYUFBYTtBQUNiLCtEQUFpRDtBQUNqRCx1REFBeUM7QUFDekMsaURBQW1DO0FBQ25DLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUMxQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsRUFDekMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxFQUN2QyxLQUFLLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLEVBQ3ZDLEtBQUssR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsRUFDdkMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxFQUN2QyxLQUFLLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLEVBQ3ZDLEtBQUssR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsRUFDdkMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxFQUN2QyxLQUFLLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLEVBQ3ZDLEtBQUssR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsRUFDdkMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxFQUN2QyxLQUFLLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLEVBQ3ZDLEtBQUssR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsRUFDdkMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBRTVDLFFBQVE7QUFDUixNQUFNLEdBQUcsR0FBd0IsaUJBQU8sRUFBRSxDQUFDO0FBRTNDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLFdBQVcsRUFDMUMsT0FBTyxHQUFHLFNBQVMsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQzlDLGVBQWUsR0FBRyxHQUFHLENBQUM7QUFFeEIsUUFBUTtLQUNMLE9BQU8sQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO0lBQzNCLGtCQUFrQixFQUFFLElBQUk7SUFDeEIsZUFBZSxFQUFFLElBQUk7SUFDckIsY0FBYyxFQUFFLElBQUk7SUFDcEIsZ0JBQWdCLEVBQUUsS0FBSztDQUN4QixDQUFDO0tBQ0QsSUFBSSxDQUFDLEdBQUcsRUFBRTtJQUNULE1BQU0sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUM7S0FDRCxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7SUFDYixNQUFNLENBQUMsS0FBSyxDQUFDLDhCQUE4QixFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM5RCxDQUFDLENBQUMsQ0FBQztBQUVMLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBSSxFQUFFLENBQUMsQ0FBQztBQUNoQixHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxjQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQ3pCLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQU8sQ0FBQyxVQUFVLENBQUMsRUFBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBTyxDQUFDLE1BQU0sQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsR0FBRyxDQUFDLEdBQUcsQ0FBQyx1QkFBWSxFQUFFLENBQUMsQ0FBQztBQUN4QixHQUFHLENBQUMsR0FBRyxDQUNMLE9BQU8sQ0FBQztJQUNOLE1BQU0sRUFBRSxPQUFPO0lBQ2YsSUFBSSxFQUFFLGlCQUFpQjtJQUN2QixNQUFNLEVBQUUsRUFBQyxNQUFNLEVBQUUsZUFBZSxHQUFHLEtBQUssRUFBQztJQUN6QyxpQkFBaUIsRUFBRSxJQUFJO0lBQ3ZCLE1BQU0sRUFBRSxJQUFJO0lBQ1osS0FBSyxFQUFFLElBQUksV0FBVyxDQUFDO1FBQ3JCLFdBQVcsRUFBRSxRQUFRO0tBQ3RCLENBQUM7Q0FDSCxDQUFDLENBQ0gsQ0FBQztBQUNGLEdBQUcsQ0FBQyxHQUFHLENBQUMsa0JBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0FBQy9CLEdBQUcsQ0FBQyxHQUFHLENBQUMsa0JBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQzVCLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQU8sQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzlCLEdBQUcsQ0FBQyxHQUFHLENBQUMsdUJBQUssRUFBRSxDQUFDLENBQUM7QUFDakIsR0FBRyxDQUFDLEdBQUcsQ0FDTCxvQkFBRyxDQUFDO0lBQ0YsZ0NBQWdDO0lBQ2hDLFVBQVUsRUFBRTtRQUNWLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQztRQUN0QixTQUFTLEVBQUU7WUFDVCxRQUFRO1lBQ1IseUJBQXlCO1lBQ3pCLDhCQUE4QjtZQUM5QixvQ0FBb0M7WUFDcEMsMEJBQTBCO1lBQzFCLHVEQUF1RDtTQUN4RDtRQUNELFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxvQ0FBb0MsQ0FBQztRQUM3RSxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDO1FBQzNCLDJEQUEyRDtRQUMzRCwyRkFBMkY7UUFDM0YsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDO1FBQ3JCLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUNsQiwwQkFBMEI7S0FDM0I7SUFDRCw4RUFBOEU7SUFDOUUseURBQXlEO0lBQ3pELFVBQVUsRUFBRSxLQUFLO0lBQ2pCLDJFQUEyRTtDQUM1RSxDQUFDLENBQ0gsQ0FBQztBQUVGLEdBQUcsQ0FBQyxHQUFHLENBQUMsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLHFCQUFVLENBQUMsR0FBRyxFQUFFO0lBQ2QsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxHQUFHO0NBQ3pDLENBQUMsQ0FBQztBQUNILEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBRXRHLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLGVBQVUsQ0FBQyxDQUFDO0FBQzdCLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLGNBQVUsQ0FBQyxDQUFDO0FBQzdCLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLGdCQUFZLENBQUMsQ0FBQztBQUNqQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxZQUFRLENBQUMsQ0FBQztBQUN2QixHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDO0tBQ25DLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUE7QUFDekMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDO0tBQ2pILElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDO0tBQ3RDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQztLQUNsQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztLQUN0QyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUM7S0FDbEMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUM7S0FDdEMsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDO0tBQ2xDLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDO0tBQ3RDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQztLQUNsQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztLQUN0QyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUM7S0FDbEMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUM7S0FDdEMsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDO0tBQ2xDLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDO0tBQ3RDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQztLQUNsQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztLQUN0QyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUM7S0FDbEMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUM7S0FDdEMsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDO0tBQ2xDLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDO0tBQ3RDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQztLQUNsQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztLQUN0QyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUM7S0FDbEMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtBQUV6QyxrQkFBUSxDQUFDLGFBQWEsQ0FBQyxVQUFVLElBQUksRUFBRSxJQUFJO0lBQ3pDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbkIsQ0FBQyxDQUFDLENBQUM7QUFDSCxrQkFBUSxDQUFDLGVBQWUsQ0FBQyxVQUFVLEdBQUcsRUFBRSxJQUFJO0lBQzFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDbEIsQ0FBQyxDQUFDLENBQUM7QUFFSCxNQUFNLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQzNDO0lBQ0UsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVO0lBQy9CLFFBQVEsRUFBRSxNQUFNLENBQUMsVUFBVTtJQUMzQixZQUFZLEVBQUUsTUFBTSxDQUFDLGNBQWM7SUFDbkMsV0FBVyxFQUFFLE9BQU8sR0FBRyxjQUFjO0lBQ3JDLEtBQUssRUFBRSxJQUFJLEVBQUUsNkJBQTZCO0lBQzFDLHNGQUFzRjtDQUN2RixFQUNELFNBQVMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUk7SUFDeEUsb0VBQW9FO0lBQ3BFLDZEQUE2RDtJQUM3RCxFQUFFO0lBQ0YsNkRBQTZEO0lBQzdELDZEQUE2RDtJQUM3RCxJQUFJLElBQUksR0FBRyxPQUFPLENBQUM7SUFDbkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7SUFDL0IsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7SUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO0lBQ25DLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxnQkFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxpREFBaUQ7SUFDcEgsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FDRixDQUFDO0FBQ0YsSUFBSSxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRTtJQUN2QyxpREFBaUQ7SUFDakQsZ0JBQWdCLENBQUMsbUJBQW1CLEdBQUcsVUFBVSxPQUFPO1FBQ3RELE9BQU8sRUFBQyxNQUFNLEVBQUUsT0FBTyxFQUFDLENBQUM7SUFDM0IsQ0FBQyxDQUFDO0NBQ0g7QUFDRCxrQkFBUSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBRS9CLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQ3BDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2pDLGtCQUFlLEdBQUcsQ0FBQyJ9
