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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRFNBdXRoQ29kZUdyYW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL0RTQXV0aENvZGVHcmFudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7R0FXRztBQUVILFlBQVksQ0FBQztBQUViLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFDOUIsUUFBUSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUNwQyxRQUFRLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsTUFBTSxFQUMzQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUM5QixFQUFFLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxnREFBZ0Q7QUFDakYsYUFBYSxHQUFHLFVBQVUsRUFDMUIsa0JBQWtCLEdBQUcsRUFBRSxDQUFDLENBQUMsZ0VBQWdFO0FBQzNGLHVDQUF1QztBQUV2Qzs7OztHQUlHO0FBQ0gsSUFBSSxlQUFlLEdBQUcsU0FBUyxnQkFBZ0IsQ0FBQyxHQUFHO0lBQ2pELGtCQUFrQjtJQUNsQixJQUFJLENBQUMsYUFBYSxHQUFHLGlCQUFpQixDQUFDO0lBQ3ZDLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLDJDQUEyQztJQUNqRyxJQUFJLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyx1REFBdUQ7SUFDL0csZ0dBQWdHO0lBQ2hHLDJEQUEyRDtJQUMzRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUMsOEJBQThCO0lBQ3JHLElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLE9BQU8sSUFBSSxH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
