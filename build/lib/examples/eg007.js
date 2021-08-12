"use strict";
/**
 * @file
 * Example 007: Get a document from an envelope
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
  dsConfig = require("../../dsconfig.js").config,
  validator = require("validator"),
  stream = require("stream");
const eg007 = exports,
  eg = "eg007", // This example reference.
  mustAuthenticate = "/ds/mustAuthenticate",
  minimumBufferMin = 3;
/**
 * Form page for this application
 */
eg007.getController = (req, res) => {
  // Check that the authentication token is ok with a long buffer time.
  // If needed, now is the best time to ask the user to authenticate
  // since they have not yet entered any information into the form.
  let tokenOK = req.dsAuthCodeGrant.checkToken();
  if (tokenOK) {
    let envelopeDocuments = req.session.envelopeDocuments,
      documentOptions;
    if (envelopeDocuments) {
      // Prepare the select items
      documentOptions = envelopeDocuments.documents.map(item => ({ text: item.name, documentId: item.documentId }));
    }
    res.render("pages/examples/eg007", {
      csrfToken: req.csrfToken(),
      title: "Download a document",
      envelopeOk: req.session.envelopeId,
      documentsOk: envelopeDocuments,
      documentOptions: documentOptions,
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
eg007.createController = (req, res) =>
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
    let envelopeDocuments = req.session.envelopeDocuments;
    if (!req.session.envelopeId || !envelopeDocuments) {
      res.render("pages/examples/eg007", {
        csrfToken: req.csrfToken(),
        title: "Download a document",
        envelopeOk: req.session.envelopeId,
        documentsOk: envelopeDocuments,
        source: dsConfig.githubExampleUrl + path.basename(__filename),
        documentation: dsConfig.documentation + eg,
        showDoc: dsConfig.documentation,
      });
    }
    // Step 2. Call the worker method
    let accountId = req.dsAuthCodeGrant.getAccountId(),
      dsAPIclient = req.dsAuthCodeGrant.getDSApi(),
      // Additional data validation might also be appropriate
      documentId = validator.escape(req.body.docSelect),
      args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        documentId: documentId,
        envelopeDocuments: envelopeDocuments,
      },
      results = null;
    try {
      results = yield eg007.worker(args);
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
      // ***DS.snippet.2.start
      res.writeHead(200, {
        "Content-Type": results.mimetype,
        "Content-disposition": "inline;filename=" + results.docName,
        "Content-Length": results.fileBytes.length,
      });
      res.end(results.fileBytes, "binary");
      // ***DS.snippet.2.end
    }
  });
/**
 * This function does the work of listing the envelope's recipients
 * @param {object} args An object with the following elements: <br/>
 *   <tt>dsAPIclient</tt>: The DocuSign API Client object, already set with an access token and base url <br/>
 *   <tt>makePromise</tt>: Function for promisfying an SDK method <br/>
 *   <tt>accountId</tt>: Current account Id <br/>
 *   <tt>documentId</tt>: the document to be fetched <br/>
 *   <tt>envelopeDocuments</tt>: object with data about the envelope's documents
 */
// ***DS.worker.start ***DS.snippet.1.start
eg007.worker = args =>
  __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient),
      getEnvelopeDocumentP = args.makePromise(envelopesApi, "getDocument"),
      results = null;
    // Step 1. EnvelopeDocuments::get.
    // Exceptions will be caught by the calling function
    results = yield getEnvelopeDocumentP(args.accountId, args.envelopeDocuments.envelopeId, args.documentId, null);
    let docItem = args.envelopeDocuments.documents.find(item => item.documentId === args.documentId),
      docName = docItem.name,
      hasPDFsuffix = docName.substr(docName.length - 4).toUpperCase() === ".PDF",
      pdfFile = hasPDFsuffix;
    // Add .pdf if it's a content or summary doc and doesn't already end in .pdf
    if ((docItem.type === "content" || docItem.type === "summary") && !hasPDFsuffix) {
      docName += ".pdf";
      pdfFile = true;
    }
    // Add .zip as appropriate
    if (docItem.type === "zip") {
      docName += ".zip";
    }
    // Return the file information
    // See https://stackoverflow.com/a/30625085/64904
    let mimetype;
    if (pdfFile) {
      mimetype = "application/pdf";
    } else if (docItem.type === "zip") {
      mimetype = "application/zip";
    } else {
      mimetype = "application/octet-stream";
    }
    return { mimetype: mimetype, docName: docName, fileBytes: results };
  });
// ***DS.worker.end ***DS.snippet.1.end
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMDcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQ3RCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sRUFDOUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFDaEMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FDM0I7QUFFTCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ2YsRUFBRSxHQUFHLE9BQU8sQ0FBQywwQkFBMEI7RUFDdkMsZ0JBQWdCLEdBQUcsc0JBQXNCLEVBQ3pDLGdCQUFnQixHQUFHLENBQUMsQ0FDckI7QUFFTDs7R0FFRztBQUNILEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDL0IscUVBQXFFO0lBQ3JFLGtFQUFrRTtJQUNsRSxpRUFBaUU7SUFDakUsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUMvQyxJQUFJLE9BQU8sRUFBRTtRQUNULElBQUksaUJBQWlCLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFDakQsZUFBZSxDQUFDO1FBQ3BCLElBQUksaUJBQWlCLEVBQUU7WUFDbkIsMkJBQTJCO1lBQzNCLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3JELENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUMzRDtRQUNE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
