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
// app.use(helmet());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFVBQVU7QUFDVixzREFBOEI7QUFDOUIsZ0RBQXdCO0FBRXhCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyQyxvREFBNEI7QUFDNUIsOERBQXFDO0FBQ3JDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQzNDLGdEQUF3QjtBQUN4Qix3REFBZ0M7QUFDaEMsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUV0RCxvREFBNEI7QUFDNUIsa0VBQWtDO0FBQ2xDLGtFQUF5QztBQUN6QyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEQsNERBQTZCO0FBRTdCLFVBQVU7QUFDVixnRUFBNkM7QUFDN0MsOERBQTRDO0FBQzVDLGtFQUFnRDtBQUNoRCwwREFBd0M7QUFDeEMsYUFBYTtBQUNiLCtEQUFpRDtBQUNqRCx1REFBeUM7QUFDekMsaURBQW1DO0FBQ25DLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUMxQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUU5QyxRQUFRO0FBQ1IsTUFBTSxHQUFHLEdBQXdCLGlCQUFPLEVBQUUsQ0FBQztBQUUzQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxXQUFXLEVBQzFDLE9BQU8sR0FBRyxTQUFTLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxFQUM5QyxlQUFlLEdBQUcsR0FBRyxDQUFBO0FBRXZCLFFBQVE7S0FDTCxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFB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