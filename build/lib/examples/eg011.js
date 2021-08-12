"use strict";
/**
 * @file
 * Example 011: Embedded sending: Remote signer, cc, envelope has three documents
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
  docusign = require("docusign-esign"),
  validator = require("validator"),
  dsConfig = require("../../dsconfig.js").config,
  eg002 = require("./eg002"); // used to create envelope
const eg011 = exports,
  eg = "eg011", // This example reference.
  mustAuthenticate = "/ds/mustAuthenticate",
  minimumBufferMin = 3,
  demoDocsPath = path.resolve(__dirname, "../../demo_documents"),
  doc2File = "World_Wide_Corp_Battle_Plan_Trafalgar.docx",
  doc3File = "World_Wide_Corp_lorem.pdf",
  dsReturnUrl = dsConfig.appUrl + "/ds-return";
/**
 * Form page for this application
 */
eg011.getController = (req, res) => {
  // Check that the authentication token is ok with a long buffer time.
  // If needed, now is the best time to ask the user to authenticate
  // since they have not yet entered any information into the form.
  let tokenOK = req.dsAuthCodeGrant.checkToken();
  if (tokenOK) {
    res.render("pages/examples/eg011", {
      csrfToken: req.csrfToken(),
      title: "Signing request by email",
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
 * Create the envelope
 * @param {object} req Request obj
 * @param {object} res Response obj
 */
eg011.createController = (req, res) =>
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
    let body = req.body,
      // Additional data validation might also be appropriate
      signerEmail = validator.escape(body.signerEmail),
      signerName = validator.escape(body.signerName),
      ccEmail = validator.escape(body.ccEmail),
      ccName = validator.escape(body.ccName),
      startingView = validator.escape(body.startingView),
      envelopeArgs = {
        signerEmail: signerEmail,
        signerName: signerName,
        ccEmail: ccEmail,
        ccName: ccName,
        dsReturnUrl: dsReturnUrl,
      },
      accountId = req.dsAuthCodeGrant.getAccountId(),
      dsAPIclient = req.dsAuthCodeGrant.getDSApi(),
      args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        startingView: startingView,
        envelopeArgs: envelopeArgs,
      },
      results = null;
    try {
      results = yield eg011.worker(args);
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
      // Redirect the user to the Sender View
      // Don't use an iFrame!
      // State can be stored/recovered using the framework's session or a
      // query parameter on the returnUrl (see the makeSenderViewRequest method)
      res.redirect(results.redirectUrl);
    }
  });
/**
 * This function does the work of creating the envelope in
 * draft mode and returning a URL for the sender's view
 * @param {object} args An object with the following elements: <br/>
 *   <tt>dsAPIclient</tt>: The DocuSign API Client object, already set with an access token and base url <br/>
 *   <tt>makePromise</tt>: Function for promisfying an SDK method <br/>
 *   <tt>accountId</tt>: Current account Id <br/>
 *   <tt>senderView</tt>: tagging or recipient
 *   <tt>envelopeArgs</tt>: envelopeArgs, an object with elements
 *      <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>ccEmail</tt>, <tt>ccName</tt>
 */
// ***DS.worker.start ***DS.snippet.1.start
eg011.worker = args =>
  __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient),
      results = null;
    // Step 1. Make the envelope with "created" (draft) status
    args.envelopeArgs.status = "created"; // We want a draft envelope
    results = yield eg002.worker(args);
    let envelopeId = results.envelopeId;
    // Step 2. create the sender view
    let viewRequest = makeSenderViewRequest(args.envelopeArgs),
      createSenderViewP = args.makePromise(envelopesApi, "createSenderView");
    // Call the CreateSenderView API
    // Exceptions will be caught by the calling function
    results = yield createSenderViewP(args.accountId, envelopeId, { returnUrlRequest: viewRequest });
    // Switch to Recipient and Documents view if requested by the user
    let url = results.url;
    console.log(`startingView: ${args.startingView}`);
    if (args.startingView === "recipient") {
      url = url.replace("send=1", "send=0");
    }
    console.log(`Sender view URL: ${url}`);
    return { envelopeId: envelopeId, redirectUrl: url };
  });
// ***DS.worker.end ***DS.snippet.1.end
// ***DS.snippet.3.start
function makeSenderViewRequest(args) {
  let viewRequest = new docusign.ReturnUrlRequest();
  // Set the url where you want the recipient to go once they are done signing
  // should typically be a callback route somewhere in your app.
  // The query parameter is included as an example of how
  // to save/recover state information during the redirect to
  // the DocuSign signing ceremony. It's usually better to use
  // the session mechanism of your web framework. Query parameters
  // can be changed/spoofed very easily.
  viewRequest.returnUrl = args.dsReturnUrl + "?state=123";
  return viewRequest;
}
// ***DS.snippet.3.end
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMTEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMTEuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQ3RCLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ3hCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFDaEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sRUFDOUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQywwQkFBMEI7Q0FDdEQ7QUFFTCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ2YsRUFBRSxHQUFHLE9BQU8sQ0FBQywwQkFBMEI7RUFDdkMsZ0JBQWdCLEdBQUcsc0JBQXNCLEVBQ3pDLGdCQUFnQixHQUFHLENBQUMsRUFDcEIsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLHNCQUFzQixDQUFDLEVBQzlELFFBQVEsR0FBRyw0Q0FBNEMsRUFDdkQsUUFBUSxHQUFHLDJCQUEyQixFQUN0QyxXQUFXLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQzdDO0FBRUw7O0dBRUc7QUFDSCxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQy9CLHFFQUFxRTtJQUNyRSxrRUFBa0U7SUFDbEUsaUVBQWlFO0lBQ2pFLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDL0MsSUFBSSxPQUFPLEVBQUU7UUFDVCxHQUFHLENBQUMsTUFBTSxDQUFDLHNCQUFzQixFQUFFO1lBQy9CLFNBQVMsRUFBRSxHQUFHLENBQUMsU0FBUyxFQUFF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
