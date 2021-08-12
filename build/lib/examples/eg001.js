"use strict";
/**
 * @file
 * Example 001: Embedded Signing Ceremony
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
  dsConfig = require("../../dsconfig.js").config;
const eg001 = exports,
  eg = "eg001", // This example reference.
  mustAuthenticate = "/ds/mustAuthenticate",
  minimumBufferMin = 3,
  signerClientId = 1000, // The id of the signer within this application.
  demoDocsPath = path.resolve(__dirname, "../../demo_documents"),
  pdf1File = "World_Wide_Corp_lorem.pdf",
  dsReturnUrl = dsConfig.appUrl + "/ds-return",
  dsPingUrl = dsConfig.appUrl + "/"; // Url that will be pinged by the DocuSign Signing Ceremony via Ajax
/**
 * Form page for this application
 */
eg001.getController = (req, res) => {
  // Check that the authentication token is ok with a long buffer time.
  // If needed, now is the best time to ask the user to authenticate
  // since they have not yet entered any information into the form.
  let tokenOK = req.dsAuthCodeGrant.checkToken();
  if (tokenOK) {
    res.render("pages/examples/eg001", {
      csrfToken: req.csrfToken(),
      title: "Embedded Signing Ceremony",
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
 * Create the envelope, the Signing Ceremony, and then redirect to the Signing Ceremony
 * @param {object} req Request obj
 * @param {object} res Response obj
 */
eg001.createController = (req, res) =>
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
      envelopeArgs = {
        signerEmail: signerEmail,
        signerName: signerName,
        signerClientId: signerClientId,
        dsReturnUrl: dsReturnUrl,
        dsPingUrl: dsPingUrl,
      },
      accountId = req.dsAuthCodeGrant.getAccountId(),
      dsAPIclient = req.dsAuthCodeGrant.getDSApi(),
      args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        envelopeArgs: envelopeArgs,
      },
      results = null;
    try {
      results = yield eg001.worker(args);
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
      // Redirect the user to the Signing Ceremony
      // Don't use an iFrame!
      // State can be stored/recovered using the framework's session or a
      // query parameter on the returnUrl (see the makeRecipientViewRequest method)
      res.redirect(results.redirectUrl);
    }
  });
/**
 * This function does the work of creating the envelope and the
 * embedded Signing Ceremony
 * @param {object} args An object with the following elements: <br/>
 *   <tt>dsAPIclient</tt>: The DocuSign API Client object, already set with an access token and base url <br/>
 *   <tt>makePromise</tt>: Function for promisfying an SDK method <br/>
 *   <tt>accountId</tt>: Current account Id <br/>
 *   <tt>envelopeArgs</tt>: envelopeArgs, an object with elements
 *      <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>signerClientId</tt>
 */
// ***DS.worker.start ***DS.snippet.1.start
eg001.worker = args =>
  __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient),
      createEnvelopeP = args.makePromise(envelopesApi, "createEnvelope"),
      results = null;
    // Step 1. Make the envelope request body
    let envelope = makeEnvelope(args.envelopeArgs);
    // Step 2. call Envelopes::create API method
    // Exceptions will be caught by the calling function
    results = yield createEnvelopeP(args.accountId, { envelopeDefinition: envelope });
    let envelopeId = results.envelopeId;
    console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
    // Step 3. create the recipient view, the Signing Ceremony
    let viewRequest = makeRecipientViewRequest(args.envelopeArgs),
      createRecipientViewP = args.makePromise(envelopesApi, "createRecipientView");
    // Call the CreateRecipientView API
    // Exceptions will be caught by the calling function
    results = yield createRecipientViewP(args.accountId, envelopeId, { recipientViewRequest: viewRequest });
    return { envelopeId: envelopeId, redirectUrl: results.url };
  });
// ***DS.worker.end ***DS.snippet.1.end
// ***DS.snippet.2.start
/**
 * Creates envelope
 * @function
 * @param {Object} args parameters for the envelope:
 *   <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>signerClientId</tt>
 * @returns {Envelope} An envelope definition
 * @private
 */
function makeEnvelope(args) {
  // document 1 (pdf) has tag /sn1/
  //
  // The envelope has one recipients.
  // recipient 1 - signer
  let docPdfBytes;
  // read file from a local directory
  // The read could raise an exception if the file is not available!
  docPdfBytes = fs.readFileSync(path.resolve(demoDocsPath, pdf1File));
  // create the envelope definition
  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = "Please sign this document";
  // add the documents
  let doc1 = new docusign.Document(),
    doc1b64 = Buffer.from(docPdfBytes).toString("base64");
  doc1.documentBase64 = doc1b64;
  doc1.name = "Lorem Ipsum"; // can be different from actual file name
  doc1.fileExtension = "pdf";
  doc1.documentId = "3";
  // The order in the docs array determines the order in the envelope
  env.documents = [doc1];
  // Create a signer recipient to sign the document, identified by name and email
  // We set the clientUserId to enable embedded signing for the recipient
  // We're setting the parameters via the object creation
  let signer1 = docusign.Signer.constructFromObject({
    email: args.signerEmail,
    name: args.signerName,
    clientUserId: args.signerClientId,
    recipientId: 1,
  });
  // Create signHere fields (also known as tabs) on the documents,
  // We're using anchor (autoPlace) positioning
  //
  // The DocuSign platform seaches throughout your envelope's
  // documents for matching anchor strings.
  let signHere1 = docusign.SignHere.constructFromObject({
    anchorString: "/sn1/",
    anchorYOffset: "10",
    anchorUnits: "pixels",
    anchorXOffset: "20",
  });
  // Tabs are set per recipient / signer
  let signer1Tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHere1],
  });
  signer1.tabs = signer1Tabs;
  // Add the recipient to the envelope object
  let recipients = docusign.Recipients.constructFromObject({
    signers: [signer1],
  });
  env.recipients = recipients;
  // Request that the envelope be sent by setting |status| to "sent".
  // To request that the envelope be created as a draft, set to "created"
  env.status = "sent";
  return env;
}
// ***DS.snippet.2.end
// ***DS.snippet.3.start
function makeRecipientViewRequest(args) {
  let viewRequest = new docusign.RecipientViewRequest();
  // Set the url where you want the recipient to go once they are done signing
  // should typically be a callback route somewhere in your app.
  // The query parameter is included as an example of how
  // to save/recover state information during the redirect to
  // the DocuSign signing ceremony. It's usually better to use
  // the session mechanism of your web framework. Query parameters
  // can be changed/spoofed very easily.
  viewRequest.returnUrl = args.dsReturnUrl + "?state=123";
  // How has your app authenticated the user? In addition to your app's
  // authentication, you can include authenticate steps from DocuSign.
  // Eg, SMS authentication
  viewRequest.authenticationMethod = "none";
  // Recipient information must match embedded recipient info
  // we used to create the envelope.
  viewRequest.email = args.signerEmail;
  viewRequest.userName = args.signerName;
  viewRequest.clientUserId = args.signerClientId;
  // DocuSign recommends that you redirect to DocuSign for the
  // Signing Ceremony. There are multiple ways to save state.
  // To maintain your application's session, use the pingUrl
  // parameter. It causes the DocuSign Signing Ceremony web page
  // (not the DocuSign server) to send pings via AJAX to your
  // app,
  viewRequest.pingFrequency = 600; // seconds
  // NOTE: The pings will only be sent if the pingUrl is an https address
  viewRequest.pingUrl = args.dsPingUrl; // optional setting
  return viewRequest;
}
// ***DS.snippet.3.end
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMDEuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQ3RCLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ3hCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFDaEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sQ0FDL0M7QUFFTCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ2YsRUFBRSxHQUFHLE9BQU8sQ0FBQywwQkFBMEI7RUFDdkMsZ0JBQWdCLEdBQUcsc0JBQXNCLEVBQ3pDLGdCQUFnQixHQUFHLENBQUMsRUFDcEIsY0FBYyxHQUFHLElBQUksQ0FBQyxnREFBZ0Q7RUFDdEUsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLHNCQUFzQixDQUFDLEVBQzlELFFBQVEsR0FBRywyQkFBMkIsRUFDdEMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsWUFBWSxFQUM1QyxTQUFTLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsb0VBQW9FO0NBQ3ZHO0FBRUw7O0dBRUc7QUFDSCxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQy9CLHFFQUFxRTtJQUNyRSxrRUFBa0U7SUFDbEUsaUVBQWlFO0lBQ2pFLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDL0MsSUFBSSxPQUFPLEVBQUU7UUFDVCxHQUFHLENBQUMsTUFBTSxDQUFDLHNCQUFzQixFQUFFO1lBQy9CLFNBQVMsRUFBRSxHQUFH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
