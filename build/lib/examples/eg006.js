"use strict";
/**
 * @file
 * Example 006: List an envelope's documents
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
  dsConfig = require("../../dsconfig.js").config;
const eg006 = exports,
  eg = "eg006", // This example reference.
  mustAuthenticate = "/ds/mustAuthenticate",
  minimumBufferMin = 3;
/**
 * Form page for this application
 */
eg006.getController = (req, res) => {
  // Check that the authentication token is ok with a long buffer time.
  // If needed, now is the best time to ask the user to authenticate
  // since they have not yet entered any information into the form.
  let tokenOK = req.dsAuthCodeGrant.checkToken();
  if (tokenOK) {
    res.render("pages/examples/eg006", {
      csrfToken: req.csrfToken(),
      title: "List envelope documents",
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
 * Get the envelope
 * @param {object} req Request obj
 * @param {object} res Response obj
 */
eg006.createController = (req, res) =>
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
    if (!req.session.envelopeId) {
      res.render("pages/examples/eg006", {
        csrfToken: req.csrfToken(),
        title: "List envelope documents",
        envelopeOk: req.session.envelopeId,
        source: dsConfig.githubExampleUrl + path.basename(__filename),
        documentation: dsConfig.documentation + eg,
        showDoc: dsConfig.documentation,
      });
    }
    // Step 2. Call the worker method
    let accountId = req.dsAuthCodeGrant.getAccountId(),
      dsAPIclient = req.dsAuthCodeGrant.getDSApi(),
      args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        envelopeId: req.session.envelopeId,
      },
      results = null;
    try {
      results = yield eg006.worker(args);
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
      // Save the envelopeId and its list of documents in the session so
      // they can be used in example 7 (download a document)
      //
      let standardDocItems = [
          { name: "Combined", type: "content", documentId: "combined" },
          { name: "Zip archive", type: "zip", documentId: "archive" },
        ],
        // The certificate of completion is named "summary".
        // We give it a better name below.
        envelopeDocItems = results.envelopeDocuments.map(doc => ({
          documentId: doc.documentId,
          name: doc.documentId === "certificate" ? "Certificate of completion" : doc.name,
          type: doc.type,
        })),
        envelopeDocuments = {
          envelopeId: req.session.envelopeId,
          documents: standardDocItems.concat(envelopeDocItems),
        };
      req.session.envelopeDocuments = envelopeDocuments; // Save
      res.render("pages/example_done", {
        title: "List envelope documents result",
        h1: "List envelope documents result",
        message: `Results from the EnvelopeDocuments::list method:`,
        json: JSON.stringify(results),
      });
    }
  });
/**
 * This function does the work of listing the envelope's documents
 * @param {object} args An object with the following elements: <br/>
 *   <tt>dsAPIclient</tt>: The DocuSign API Client object, already set with an access token and base url <br/>
 *   <tt>makePromise</tt>: Function for promisfying an SDK method <br/>
 *   <tt>accountId</tt>: Current account Id <br/>
 *   <tt>envelopeId</tt>: envelope Id <br/>
 */
// ***DS.worker.start ***DS.snippet.1.start
eg006.worker = args =>
  __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient),
      listEnvelopeDocumentsP = args.makePromise(envelopesApi, "listDocuments"),
      results = null;
    // Step 1. EnvelopeDocuments::list.
    // Exceptions will be caught by the calling function
    results = yield listEnvelopeDocumentsP(args.accountId, args.envelopeId, null);
    return results;
  });
// ***DS.worker.end ***DS.snippet.1.end
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMDYuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQ3RCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sQ0FDL0M7QUFFTCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ2YsRUFBRSxHQUFHLE9BQU8sQ0FBQywwQkFBMEI7RUFDdkMsZ0JBQWdCLEdBQUcsc0JBQXNCLEVBQ3pDLGdCQUFnQixHQUFHLENBQUMsQ0FDckI7QUFFTDs7R0FFRztBQUNILEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDL0IscUVBQXFFO0lBQ3JFLGtFQUFrRTtJQUNsRSxpRUFBaUU7SUFDakUsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUMvQyxJQUFJLE9BQU8sRUFBRTtRQUNULEdBQUcsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUU7WUFDL0IsU0FBUyxFQUFFLEdBQUcsQ0FBQyxTQUFTLEVBQUU7WUFDMUIsS0FBSyxFQUFFLHlCQUF5QjtZQUNoQyxVQUFVLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVO1lBQ2xDLE1BQU0sRUFBRSxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7WUFDN0QsYUFBYSxFQUFFLFFBQVEsQ0FBQyxhQUFhLEdBQUcsRUFBRTtZQUMxQyxPQUFPLEVBQUUsUUFBUSxDQUFDLGFBQWE7U0FDbEMsQ0FBQyxDQUFDO0tBQ047U0FBTTtRQUNILHdFQUF3RTtRQUN4RSxHQUFHLENBQUMsZUFBZSxD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
