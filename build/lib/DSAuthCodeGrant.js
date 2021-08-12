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
  { promisify } = require("util"), // http://2ality.com/2017/05/util-promisify.html
  baseUriSuffix = "/restapi",
  tokenReplaceMinGet = 60; // For a form Get, the token must expire at least this number of
// minutes later or it will be replaced
/**
 * Manages OAuth Authentication Code Grant with DocuSign.
 * @constructor
 * @param {object} req - The request object.
 */
let DSAuthCodeGrant = function _DSAuthCodeGrant(req) {
  // private globals
  this._debug_prefix = "DSAuthCodeGrant";
  this._accessToken = req.user && req.user.accessToken; // The bearer token. Get it via #checkToken
  this._refreshToken = req.user && req.user.refreshToken; // Note, the refresh token is not used in this example.
  // For production use, you'd want to store the refresh token in non-volatile storage since it is
  // good for 30 days. You'd probably want to encrypt it too.
  this._tokenExpiration = req.user && req.user.tokenExpirationTimestamp; // when does the token expire?
  this._accountId = req.session && req.session.accountId; // current account
  this._accountName = req.session && req.session.accountName; // current account's name
  this._basePath = req.session && req.session.basePath; // current base path. eg https://na2.docusign.net/restapi
  this._dsApiClient = null; // the docusign sdk instance
  this._dsConfig = null;
  this._debug = true; // ### DEBUG ### setting
  // INITIALIZE
  this._dsApiClient = new docusign.ApiClient();
  if (this._basePath) {
    this._dsApiClient.setBasePath(this._basePath);
  }
  if (this._accessToken) {
    this._dsApiClient.addDefaultHeader("Authorization", "Bearer " + this._accessToken);
  }
}; // end of DSAuthCodeGrant constructor function
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
  // The DocuSign Passport strategy looks up the user's account information via OAuth::userInfo.
  // See https://developers.docusign.com/esign-rest-api/guides/authentication/user-info-endpoints
  // The data includes the user's information and information on the accounts the user has access too.
  //
  // To make an API or SDK call, the accountId and base url are needed.
  //
  // A user can (and often) belongs to multiple accounts.
  // You can search for a specific account the user has, or
  // give the user the choice of account to use, or use
  // the user's default account. This example looks for a specific account or the default account.
  //
  // The baseUri changes rarely so it can (and should) be cached.
  //
  // req.user holds the result of the DocuSign OAuth call and the OAuth::userInfo method,
  // except for the expires element.
  // req.user.accessToken: "eyJ0Xbz....vXXFw7IlVwfDRA"
  // req.user.accounts:  An array of accounts that the user has access to
  //     An example account:
  //      {account_id: "8118f2...8a",
  //      is_default: false,
  //      account_name: "Xylophone World",
  //      base_uri: "https://demo.docusign.net"}  (Note: does not include '/restapi/v2')
  // created: "2015-05-20T11:48:23.363"  // when was the user's record created
  // email: "name@example.com" // the user's email
  // The expires element is added in function _processDsResult in file index.js.
  // It is the datetime when the token will expire:
  // expires: Moment {_isAMomentObject: true, _isUTC: false, _pf: {…}, _locale: Locale, _d: Tue Jun 26 2018 04:05:37 GMT+0300 (IDT), …}
  // expiresIn: 28800  // when the token will expire, in seconds, from when the OAuth response is sent by DocuSign
  // family_name: "LastName" // the user's last name
  // given_name: "Larry" // the user's first name
  // name: "Larry LastName"
  // provider: "docusign"
  // refreshToken: "eyJ0eXAiOiJ...HB4Q" // Can be used to obtain a new set of access and response tokens.
  // The lifetime for the refreshToken is typically 30 days
  // sub: "...5fed18870" // the user's id in guid format
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRFNBdXRoQ29kZUdyYW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL0RTQXV0aENvZGVHcmFudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7RUFXRTtBQUVGLFlBQVksQ0FBQztBQUViLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFDNUIsUUFBUSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUNwQyxRQUFRLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsTUFBTSxFQUMzQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUM5QixFQUFFLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxnREFBZ0Q7RUFDaEYsYUFBYSxHQUFHLFVBQVUsRUFDMUIsa0JBQWtCLEdBQUcsRUFBRSxDQUFDLENBQUMsZ0VBQWdFO0FBQzdGLHVDQUF1QztBQUV2QyxDQUFDO0FBQ0Q7Ozs7R0FJRztBQUNILElBQUksZUFBZSxHQUFHLFNBQVMsZ0JBQWdCLENBQUMsR0FBRztJQUNqRCxrQkFBa0I7SUFDbEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQztJQUN2QyxJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBRywyQ0FBMkM7SUFDbkcsSUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUcsdURBQXVEO0lBQ2pILGlHQUFpRztJQUNqRywyREFBMkQ7SUFDM0QsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFFLDhCQUE4QjtJQUN0RyxJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxP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
