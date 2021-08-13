/**
 * @file
 * This file implements the <tt>DSAuthCodeGrant</tt> class.
 * It handles the OAuth Authorization Code Grant flow.
 * It also looks up the user's default account and baseUrl
 *
 * For the purposes of this example, it ignores the refresh
 * token that is returned from DocuSign. In production,
 * depending on your use case, you can store and then use the
 * refresh token instead of requiring the user to re-authenticate.
 * @author DocuSign
 */

"use strict";

const moment = require("moment"),
  docusign = require("docusign-esign"),
  dsConfig = require("../dsconfig.js").config,
  passport = require("passport"),
  { promisify } = require("util"),
  baseUriSuffix = "/restapi",
  tokenReplaceMinGet = 60;
/**
 * Manages OAuth Authentication Code Grant with DocuSign.
 * @constructor
 * @param {object} req - The request object.
 */
let DSAuthCodeGrant = function _DSAuthCodeGrant(req) {
  this._debug_prefix = "DSAuthCodeGrant";
  this._accessToken = req.user && req.user.accessToken;
  this._refreshToken = req.user && req.user.refreshToken;
  this._tokenExpiration = req.user && req.user.tokenExpirationTimestamp; // when does the token expire?
  this._accountId = req.session && req.session.accountId; // current account
  this._accountName = req.session && req.session.accountName; // current account's name
  this._basePath = req.session && req.session.basePath; // current base path. eg https://na2.docusign.net/restapi
  this._dsApiClient = null; // the docusign sdk instance
  this._dsConfig = null;
  this._debug = true; // ### DEBUG ### setting


  this._dsApiClient = new docusign.ApiClient();
  if (this._basePath) {
    this._dsApiClient.setBasePath(this._basePath);
  }
  if (this._accessToken) {
    this._dsApiClient.addDefaultHeader("Authorization", "Bearer " + this._accessToken);
  }
};

// Public constants
/**
 * Exception when setting an account
 * @constant
 */
DSAuthCodeGrant.prototype.Error_set_account = "Error_set_account";
/**
 * Exception: Could not find account information for the user
 * @constant
 */
DSAuthCodeGrant.prototype.Error_account_not_found = "Could not find account information for the user";
/**
 * Exception when getting a token, "invalid grant"
 * @constant
 */
DSAuthCodeGrant.prototype.Error_invalid_grant = "invalid_grant"; // message when bad client_id is provided

// public functions
DSAuthCodeGrant.prototype.login = function (req, res, next) {
  // Reset
  this.internalLogout(req, res);
  passport.authenticate("docusign")(req, res, next);
};

DSAuthCodeGrant.prototype.oauth_callback1 = (req, res, next) => {
  // This callback URL is used for the login flow
  passport.authenticate("docusign", { failureRedirect: "/ds/login" })(req, res, next);
};
DSAuthCodeGrant.prototype.oauth_callback2 = function _oauth_callback2(req, res, next) {
  //console.log(`Received access_token: ${req.user.accessToken.substring(0,15)}...`);
  console.log(`Received access_token: |${req.user.accessToken}|`);
  console.log(`Expires at ${req.user.tokenExpirationTimestamp.format("dddd, MMMM Do YYYY, h:mm:ss a")}`);
  req.flash("info", "You have authenticated with DocuSign.");
  this._dsApiClient.addDefaultHeader("Authorization", "Bearer " + req.user.accessToken);

  this.getDefaultAccountInfo(req);

  // If an example was requested, but authentication was needed (and done),
  // Then do the example's GET now.
  // Else redirect to home
  if (req.session.eg) {
    let eg = req.session.eg;
    req.session.eg = null;
    res.redirect(`/${eg}`);
  } else {
    res.redirect("/");
  }
};

/**
 * Clears the DocuSign authentication session token
 * https://account-d.docusign.com/oauth/logout
 * @function
 */
DSAuthCodeGrant.prototype.logout = function _logout(req, res) {
  let logoutCB = encodeURIComponent(res.locals.hostUrl + "/ds/logoutCallback"),
    oauthServer = dsConfig.dsOauthServer,
    client_id = dsConfig.dsClientId,
    logoutURL = `${oauthServer}/logout?client_id=${client_id}&redirect_uri=${logoutCB}&response_mode=logout_redirect`;
  //console.log (`Redirecting to ${logoutURL}`);
  //res.redirect(logoutURL);

  // Currently, the OAuth logout API method has a bug: ID-3276
  // Until the bug is fixed, just do a logout from within this app:
  this.logoutCallback(req, res);
};

/**
 * Clears the user information including the tokens.
 * @function
 */
DSAuthCodeGrant.prototype.logoutCallback = function _logout(req, res) {
  req.logout(); // see http://www.passportjs.org/docs/logout/
  this.internalLogout(req, res);
  req.flash("info", "You have logged out.");
  res.redirect("/");
};

/**
 * Clears the object's and session's user information including the tokens.
 * @function
 */
DSAuthCodeGrant.prototype.internalLogout = function _internalLogout(req, res) {
  this._accessToken = null;
  this._refreshToken = null;
  this._tokenExpiration = null;
  this._accountId = null;
  this._accountName = null;
  this._basePath = null;
  req.session.accountId = null;
  req.session.accountName = null;
  req.session.basePath = null;
};

/**
 * Find the accountId, accountName, and baseUri that will be used.
 * The dsConfig.targetAccountId may be used to find a specific account (if the user has access to it).
 * Side effect: store in the session
 * @function
 * @param req the request object
 */
DSAuthCodeGrant.prototype.getDefaultAccountInfo = function _getDefaultAccountInfo(req) {
  const targetAccountId = dsConfig.targetAccountId,
    accounts = req.user.accounts;
  let account = null; // the account we want to use
  // Find the account...
  if (targetAccountId) {
    account = accounts.find(a => a.account_id == targetAccountId);
    if (!account) {
      throw new Error(this.Error_account_not_found);
    }
  } else {
    account = accounts.find(a => a.is_default);
  }

  // Save the account information
  this._accountId = account.account_id;
  this._accountName = account.account_name;
  this._basePath = account.base_uri + baseUriSuffix;

  req.session.accountId = this._accountId;
  req.session.accountName = this._accountName;
  req.session.basePath = this._basePath;

  this._dsApiClient.setBasePath(this._basePath);
  console.log(`Using account ${this._accountId}: ${this._accountName}`);
};

/**
 * Returns a promise method, {methodName}_promise, that is a
 * promisfied version of the method parameter.
 * The promise method is created if it doesn't already exist.
 * It is cached via attachment to the parent object.
 * @function
 * @param obj An object that has method methodName
 * @param methodName The string name of the existing method
 * @returns {promise} a promise version of the <tt>methodName</tt>.
 */
DSAuthCodeGrant.prototype.makePromise = function _makePromise(obj, methodName) {
  let promiseName = methodName + "_promise";
  if (!(promiseName in obj)) {
    obj[promiseName] = promisify(obj[methodName]).bind(obj);
  }
  return obj[promiseName];
};

/**
 * This is the key method for the object.
 * It should be called before any API call to DocuSign.
 * It checks that the existing access token can be used.
 * If the existing token is expired or doesn't exist, then
 * a new token will be obtained from DocuSign by telling the
 * user that they must authenticate themself.
 * @function
 * @param integer bufferMin How long must the access token be valid
 * @returns boolean tokenOK
 */
DSAuthCodeGrant.prototype.checkToken = function _checkToken(bufferMin = tokenReplaceMinGet) {
  let noToken = !this._accessToken || !this._tokenExpiration,
    now = moment(),
    needToken = noToken || moment(this._tokenExpiration).subtract(bufferMin, "m").isBefore(now);
  if (this._debug) {
    if (noToken) {
      this._debug_log("checkToken: Starting up--need a token");
    }
    if (needToken && !noToken) {
      this._debug_log("checkToken: Replacing old token");
    }
    //if (!needToken) {this._debug_log('checkToken: Using current token')}
  }

  return !needToken;
};

/**
 * Store the example number in session storage so it will be
 * used after the user is authenticated
 * @function
 * @param object req The request object
 * @param string eg The example number that should be started after authentication
 */
DSAuthCodeGrant.prototype.setEg = function _setEg(req, eg) {
  req.session.eg = eg;
};

/**
 * Getter for the object's <tt>dsApiClient</tt>
 * @function
 * @returns {DSApiClient} dsApiClient
 */
DSAuthCodeGrant.prototype.getDSApi = function () {
  return this._dsApiClient;
};

/**
 * Getter for the object's <tt>accessToken</tt>
 * First check its validity via checkToken
 * @function
 * @returns {BearerToken} accessToken
 */
DSAuthCodeGrant.prototype.getAccessToken = function () {
  return this._accessToken;
};

/**
 * Getter for the <tt>accountId</tt>
 * @function
 * @returns {string} accountId
 */
DSAuthCodeGrant.prototype.getAccountId = function () {
  return this._accountId;
};

/**
 * Getter for the <tt>accountName</tt>
 * @function
 * @returns {string} accountName
 */
DSAuthCodeGrant.prototype.getAccountName = function () {
  return this._accountName;
};

/**
 * Getter for the <tt>baseUri</tt>
 * @function
 * @returns {string} baseUri
 */
DSAuthCodeGrant.prototype.getBasePath = function () {
  return this._basePath;
};

/**
 * If in debug mode, prints message to the console
 * @function
 * @param {string} m The message to be printed
 * @private
 */
DSAuthCodeGrant.prototype._debug_log = function (m) {
  if (!this._debug) {
    return;
  }
  console.log(this._debug_prefix + ": " + m);
};

/**
 * If in debug mode, prints message and object to the console
 * @function
 * @param {string} m The message to be printed
 * @param {object} obj The object to be pretty-printed
 * @private
 */
DSAuthCodeGrant.prototype._debug_log_obj = function (m, obj) {
  if (!this._debug) {
    return;
  }
  console.log(this._debug_prefix + ": " + m + "\n" + JSON.stringify(obj, null, 4));
};

module.exports = DSAuthCodeGrant; // SET EXPORTS for the module.
