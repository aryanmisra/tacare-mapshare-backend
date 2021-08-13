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
app.use(express_1.default.urlencoded({ extended: false, limit: "3mb" }));
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
app.use(express_1.default.json({ limit: "3mb" }));
app.use(middleware.dsHandler);
app.use(express_flash_1.default());
app.use(helmet_csp_1.default({
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
        objectSrc: ["'self'"],
        fontSrc: ["data:"],
    },
    reportOnly: false,
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
    state: true,
}, function _processDsResult(accessToken, refreshToken, params, profile, done) {
    let user = profile;
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.expiresIn = params.expires_in;
    user.tokenExpirationTimestamp = moment_1.default().add(user.expiresIn, "s");
    return done(null, user);
});
if (!dsConfig.allowSilentAuthentication) {
    docusignStrategy.authorizationParams = function (options) {
        return { prompt: "login" };
    };
}
passport_1.default.use(docusignStrategy);
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);
exports.default = app;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFVBQVU7QUFDVixzREFBOEI7QUFDOUIsZ0RBQXdCO0FBQ3hCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyQyxvREFBNEI7QUFDNUIsOERBQXFDO0FBQ3JDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQzNDLGdEQUF3QjtBQUN4Qix3REFBZ0M7QUFDaEMsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUN0RCxvREFBNEI7QUFDNUIsa0VBQWtDO0FBQ2xDLGtFQUF5QztBQUN6QyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEQsNERBQTZCO0FBQzdCLFVBQVU7QUFDVixnRUFBNkM7QUFDN0MsOERBQTRDO0FBQzVDLGtFQUFnRDtBQUNoRCwwREFBd0M7QUFDeEMsYUFBYTtBQUNiLCtEQUFpRDtBQUNqRCx1REFBeUM7QUFDekMsaURBQW1DO0FBQ25DLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUcxQyxRQUFRO0FBQ1IsTUFBTSxHQUFHLEdBQXdCLGlCQUFPLEVBQUUsQ0FBQztBQUUzQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxXQUFXLEVBQzFDLE9BQU8sR0FBRyxTQUFTLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxFQUM5QyxlQUFlLEdBQUcsR0FBRyxDQUFDO0FBRXhCLFFBQVE7S0FDTCxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtJQUMzQixrQkFBa0IsRUFBRSxJQUFJO0lBQ3hCLGVBQWUsRUFBRSxJQUFJO0lB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