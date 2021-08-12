"use strict";
/**
 * @file
 * Example 012: Embedded NDSE (console)
 * @author DocuSign
 */
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
const path = require("path"),
  fs = require("fs-extra"),
  validator = require("validator"),
  docusign = require("docusign-esign"),
  dsConfig = require("../../dsconfig.js").config;
const eg012 = exports,
  eg = "eg012", // This example reference.
  mustAuthenticate = "/ds/mustAuthenticate",
  minimumBufferMin = 3,
  dsReturnUrl = dsConfig.appUrl + "/ds-return";
/**
 * Form page for this application
 */
eg012.getController = (req, res) => {
  // Check that the authentication token is ok with a long buffer time.
  // If needed, now is the best time to ask the user to authenticate
  // since they have not yet entered any information into the form.
  let tokenOK = req.dsAuthCodeGrant.checkToken();
  if (tokenOK) {
    res.render("pages/examples/eg012", {
      csrfToken: req.csrfToken(),
      title: "Embedded DocuSign web tool",
      envelopeOk: req.session.envelopeId,
      source: dsConfig.githubExampleUrl + path.basename(__filename),
      documentation: dsConfig.documentation + eg,
      showDoc: dsConfig.documentation,
    });
  } else {
    // Save the current operation so it will be resumed after authentication
    req.dsAuthCodeGrant.setEg(req, eg);
    res.redirect(mustAuthenticate);
  }
};
/**
 * The controller
 * @param {object} req Request obj
 * @param {object} res Response obj
 */
eg012.createController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    // Step 1. Check the token
    // At this point we should have a good token. But we
    // double-check here to enable a better UX to the user.
    let tokenOK = req.dsAuthCodeGrant.checkToken(minimumBufferMin);
    if (!tokenOK) {
      req.flash("info", "Sorry, you need to re-authenticate.");
      // We could store the parameters of the requested operation
      // so it could be restarted automatically.
      // But since it should be rare to have a token issue here,
      // we'll make the user re-enter the form data after
      // authentication.
      req.dsAuthCodeGrant.setEg(req, eg);
      res.redirect(mustAuthenticate);
    }
    // Step 2. Call the worker method
    let accountId = req.dsAuthCodeGrant.getAccountId(),
      dsAPIclient = req.dsAuthCodeGrant.getDSApi(),
      body = req.body,
      // Additional data validation might also be appropriate
      startingView = validator.escape(body.startingView),
      args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        dsReturnUrl: dsReturnUrl,
        startingView: startingView,
        envelopeId: req.session.envelopeId, // may be undefined
      },
      results = null;
    try {
      results = yield eg012.worker(args);
    } catch (error) {
      let errorBody = error && error.response && error.response.body,
        // we can pull the DocuSign error code and message from the response body
        errorCode = errorBody && errorBody.errorCode,
        errorMessage = errorBody && errorBody.message;
      // In production, may want to provide customized error messages and
      // remediation advice to the user.
      res.render("pages/error", { err: error, errorCode: errorCode, errorMessage: errorMessage });
    }
    if (results) {
      // Redirect the user to the NDSE View
      // Don't use an iFrame!
      // State can be stored/recovered using the framework's session or a
      // query parameter on the returnUrl (see the makeSenderViewRequest method)
      res.redirect(results.redirectUrl);
    }
  });
/**
 * This function does the work of returning a URL for the NDSE view
 * @param {object} args An object with the following elements: <br/>
 *   <tt>dsAPIclient</tt>: The DocuSign API Client object, already set
 *       with an access token and base url <br/>
 *   <tt>makePromise</tt>: Function for promisfying an SDK method <br/>
 *   <tt>accountId</tt>: Current account Id <br/>
 *   <tt>dsReturnUrl</tt>: the return url back to this app
 *   <tt>envelopeId</tt>: optional envelope for the NDSE to focus on
 */
// ***DS.worker.start ***DS.snippet.1.start
eg012.worker = args =>
  __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient),
      results = null;
    // Step 1. create the NDSE view
    let viewRequest = makeConsoleViewRequest(args),
      createConsoleViewP = args.makePromise(envelopesApi, "createConsoleView");
    // Call the CreateSenderView API
    // Exceptions will be caught by the calling function
    results = yield createConsoleViewP(args.accountId, { consoleViewRequest: viewRequest });
    let url = results.url;
    console.log(`NDSE view URL: ${url}`);
    return { redirectUrl: url };
  });
// ***DS.worker.end ***DS.snippet.1.end
// ***DS.snippet.2.start
function makeConsoleViewRequest(args) {
  let viewRequest = new docusign.ConsoleViewRequest();
  // Set the url where you want the recipient to go once they are done
  // with the NDSE. It is usually the case that the
  // user will never "finish" with the NDSE.
  // Assume that control will not be passed back to your app.
  viewRequest.returnUrl = args.dsReturnUrl;
  if (args.startingView == "envelope" && args.envelopeId) {
    viewRequest.envelopeId = args.envelopeId;
  }
  return viewRequest;
}
// ***DS.snippet.2.end
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMTIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMTIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQ3RCLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ3hCLFNBQVMsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQ2hDLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sQ0FDL0M7QUFFTCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ2YsRUFBRSxHQUFHLE9BQU8sQ0FBQywwQkFBMEI7RUFDdkMsZ0JBQWdCLEdBQUcsc0JBQXNCLEVBQ3pDLGdCQUFnQixHQUFHLENBQUMsRUFDcEIsV0FBVyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUM3QztBQUVMOztHQUVHO0FBQ0gsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtJQUMvQixxRUFBcUU7SUFDckUsa0VBQWtFO0lBQ2xFLGlFQUFpRTtJQUNqRSxJQUFJLE9BQU8sR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQy9DLElBQUksT0FBTyxFQUFFO1FBQ1QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRTtZQUMvQixTQUFTLEVBQUUsR0FBRyxDQUFDLFNBQVMsRUFBRTtZQUMxQixLQUFLLEVBQUUsNEJBQTRCO1lBQ25DLFVBQVUsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVU7WUFDbEMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUM3RCxhQUFhLEVBQUUsUUFB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
