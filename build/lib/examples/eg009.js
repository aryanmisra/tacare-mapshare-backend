"use strict";
/**
 * @file
 * Example 009: Send envelope using a template
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
  docusign = require("docusign-esign"),
  validator = require("validator"),
  dsConfig = require("../../dsconfig.js").config;
const eg009 = exports,
  eg = "eg009", // This example reference.
  mustAuthenticate = "/ds/mustAuthenticate",
  minimumBufferMin = 3;
/**
 * Form page for this application
 */
eg009.getController = (req, res) => {
  // Check that the authentication token is ok with a long buffer time.
  // If needed, now is the best time to ask the user to authenticate
  // since they have not yet entered any information into the form.
  let tokenOK = req.dsAuthCodeGrant.checkToken();
  if (tokenOK) {
    res.render("pages/examples/eg009", {
      csrfToken: req.csrfToken(),
      title: "Send envelope using a template",
      templateOk: req.session.templateId,
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
 * Send envelope with a template
 * @param {object} req Request obj
 * @param {object} res Response obj
 */
eg009.createController = (req, res) =>
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
    if (!req.session.templateId) {
      res.render("pages/examples/eg009", {
        csrfToken: req.csrfToken(),
        title: "Send envelope using a template",
        templateOk: req.session.templateId,
        source: dsConfig.githubExampleUrl + path.basename(__filename),
        documentation: dsConfig.documentation + eg,
        showDoc: dsConfig.documentation,
      });
    }
    // Step 2. Call the worker method
    let body = req.body,
      // Additional data validation might also be appropriate
      signerEmail = validator.escape(body.signerEmail),
      signerName = validator.escape(body.signerName),
      ccEmail = validator.escape(body.ccEmail),
      ccName = validator.escape(body.ccName),
      envelopeArgs = {
        templateId: req.session.templateId,
        signerEmail: signerEmail,
        signerName: signerName,
        ccEmail: ccEmail,
        ccName: ccName,
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
      results = yield eg009.worker(args);
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
      req.session.envelopeId = results.envelopeId; // Save for use by other examples
      // which need an envelopeId
      res.render("pages/example_done", {
        title: "Envelope sent",
        h1: "Envelope sent",
        message: `The envelope has been created and sent!<br/>Envelope ID ${results.envelopeId}.`,
      });
    }
  });
/**
 * This function does the work of creating the envelope
 * @param {object} args An object with the following elements: <br/>
 *   <tt>dsAPIclient</tt>: The DocuSign API Client object, already set with an access token and base url <br/>
 *   <tt>makePromise</tt>: Function for promisfying an SDK method <br/>
 *   <tt>accountId</tt>: Current account Id <br/>
 *   <tt>envelopeArgs</tt>: envelopeArgs, an object with elements
 *      <tt>templateId</tt>, <tt>signerEmail</tt>, <tt>signerName</tt>,
 *      <tt>ccEmail</tt>, <tt>ccName</tt>
 */
// ***DS.worker.start ***DS.snippet.1.start
eg009.worker = args =>
  __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient),
      createEnvelopeP = args.makePromise(envelopesApi, "createEnvelope"),
      results = null;
    // Step 1. Make the envelope request body
    let envelope = makeEnvelope(args.envelopeArgs);
    // Step 2. call Envelopes::create API method
    // Exceptions will be caught by the calling function
    results = yield createEnvelopeP(args.accountId, { envelopeDefinition: envelope });
    return results;
  });
// ***DS.worker.end ***DS.snippet.1.end
// ***DS.snippet.2.start
/**
 * Creates envelope from the template
 * @function
 * @param {Object} args parameters for the envelope:
 *   <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>ccEmail</tt>, <tt>ccName</tt>,
 *   <tt>templateId</tt>
 * @returns {Envelope} An envelope definition
 * @private
 */
function makeEnvelope(args) {
  // The envelope has two recipients.
  // recipient 1 - signer
  // recipient 2 - cc
  // create the envelope definition
  let env = new docusign.EnvelopeDefinition();
  env.templateId = args.templateId;
  // Create template role elements to connect the signer and cc recipients
  // to the template
  // We're setting the parameters via the object creation
  let signer1 = docusign.TemplateRole.constructFromObject({
    email: args.signerEmail,
    name: args.signerName,
    roleName: "signer",
  });
  // Create a cc template role.
  // We're setting the parameters via setters
  let cc1 = new docusign.TemplateRole();
  cc1.email = args.ccEmail;
  cc1.name = args.ccName;
  cc1.roleName = "cc";
  // Add the TemplateRole objects to the envelope object
  env.templateRoles = [signer1, cc1];
  env.status = "sent"; // We want the envelope to be sent
  return env;
}
// ***DS.snippet.2.end
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMDkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQ3RCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFDaEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sQ0FDL0M7QUFFTCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ2YsRUFBRSxHQUFHLE9BQU8sQ0FBQywwQkFBMEI7RUFDdkMsZ0JBQWdCLEdBQUcsc0JBQXNCLEVBQ3pDLGdCQUFnQixHQUFHLENBQUMsQ0FDckI7QUFFTDs7R0FFRztBQUNILEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDL0IscUVBQXFFO0lBQ3JFLGtFQUFrRTtJQUNsRSxpRUFBaUU7SUFDakUsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUMvQyxJQUFJLE9BQU8sRUFBRTtRQUNULEdBQUcsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUU7WUFDL0IsU0FBUyxFQUFFLEdBQUcsQ0FBQyxTQUFTLEVBQUU7WUFDMUIsS0FBSyxFQUFFLGdDQUFnQztZQUN2QyxVQUFVLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVO1lBQ2xDLE1BQU0sRUFBRSxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7WUFDN0QsYUFBYSxFQUFFLFFBQVEsQ0FBQyxhQUFhLEdBQUcsRUFBRTtZQUMxQyxPQUFPLEVBQUUsUUFBUSxDQUFDLGFBQWE7U0FDbEMsQ0FBQyxDQUFDO0tBQ047U0FB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
