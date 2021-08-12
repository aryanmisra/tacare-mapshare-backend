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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRFNBdXRoQ29kZUdyYW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vaGVscGVycy9EU0F1dGhDb2RlR3JhbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7O0VBV0U7QUFFRixZQUFZLENBQUM7QUFFYixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQzFCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE1BQU0sRUFDM0MsUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFDOUIsRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsZ0RBQWdEO0VBQ2hGLGFBQWEsR0FBRyxVQUFVLEVBQzFCLGtCQUFrQixHQUFHLEVBQUUsQ0FBQyxDQUFDLGdFQUFnRTtBQUMvRix1Q0FBdUM7QUFFdkMsQ0FBQztBQUNEOzs7O0dBSUc7QUFDSCxJQUFJLGVBQWUsR0FBRyxTQUFTLGdCQUFnQixDQUFDLEdBQUc7SUFDL0Msa0JBQWtCO0lBQ2xCLElBQUksQ0FBQyxhQUFhLEdBQUcsaUJBQWlCLENBQUM7SUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUcsMkNBQTJDO0lBQ25HLElBQUksQ0FBQyxhQUFhLEdBQUcsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFHLHVEQUF1RDtJQUNqSCxpR0FBaUc7SUFDakcsMkRBQTJEO0lBQzNELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBRSw4QkFBOEI7SUFDdEcsSUFBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENB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
