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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
const eg002 = require("./lib/examples/eg002");
//Setups
const app = express_1.default();
const HOST = process.env.HOST || "localhost", hostUrl = "http://" + HOST + ":" + config.PORT, max_session_min = 180;
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
app.use(session({
    secret: "12345",
    name: "Tacare MapShare",
    cookie: { maxAge: max_session_min * 60000 },
    saveUninitialized: true,
    resave: true,
    store: new MemoryStore({
        checkPeriod: 86400000,
    }),
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(express_1.default.json({ limit: "1mb" }));
app.use(middleware.dsHandler);
app.use(express_flash_1.default());
app.use(helmet_csp_1.default({
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
}));
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
const docusignStrategy = new DocusignStrategy({
    production: dsConfig.production,
    clientID: config.dsClientId,
    clientSecret: config.dsClientSecret,
    callbackURL: hostUrl + "/ds/callback",
    state: true, // automatic CSRF protection.
    // See https://github.com/jaredhanson/passport-oauth2/blob/master/lib/state/session.js
}, function _processDsResult(accessToken, refreshToken, params, profile, done) {
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
});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFVBQVU7QUFDVixzREFBOEI7QUFDOUIsZ0RBQXdCO0FBQ3hCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyQyxvREFBNEI7QUFDNUIsOERBQXFDO0FBQ3JDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQzNDLGdEQUF3QjtBQUN4Qix3REFBZ0M7QUFDaEMsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUN0RCxvREFBNEI7QUFDNUIsa0VBQWtDO0FBQ2xDLGtFQUF5QztBQUN6QyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEQsNERBQTZCO0FBQzdCLFVBQVU7QUFDVixnRUFBNkM7QUFDN0MsOERBQTRDO0FBQzVDLGtFQUFnRDtBQUNoRCwwREFBd0M7QUFDeEMsYUFBYTtBQUNiLCtEQUFpRDtBQUNqRCx1REFBeUM7QUFDekMsaURBQW1DO0FBQ25DLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUMxQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUU5QyxRQUFRO0FBQ1IsTUFBTSxHQUFHLEdBQXdCLGlCQUFPLEVBQUUsQ0FBQztBQUUzQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxXQUFXLEVBQzFDLE9BQU8sR0FBRyxTQUFTLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxFQUM5QyxlQUFlLEdBQUcsR0FBRyxDQUFDO0FBRXhCLFFBQVE7S0FDTCxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFB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