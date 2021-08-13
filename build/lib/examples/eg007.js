"use strict";
/**
 * @file
 * Example 007: Get a document from an envelope
 * @author DocuSign
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const path = require("path"), docusign = require("docusign-esign"), dsConfig = require("../../dsconfig.js").config, validator = require("validator"), stream = require("stream");
const eg007 = exports, eg = "eg007", // This example reference.
mustAuthenticate = "/ds/mustAuthenticate", minimumBufferMin = 3;
/**
 * Form page for this application
 */
eg007.getController = (req, res) => {
    // Check that the authentication token is ok with a long buffer time.
    // If needed, now is the best time to ask the user to authenticate
    // since they have not yet entered any information into the form.
    let tokenOK = req.dsAuthCodeGrant.checkToken();
    if (tokenOK) {
        let envelopeDocuments = req.session.envelopeDocuments, documentOptions;
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
    }
    else {
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
eg007.createController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    let accountId = req.dsAuthCodeGrant.getAccountId(), dsAPIclient = req.dsAuthCodeGrant.getDSApi(), 
    // Additional data validation might also be appropriate
    documentId = validator.escape(req.body.docSelect), args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        documentId: documentId,
        envelopeDocuments: envelopeDocuments,
    }, results = null;
    try {
        results = yield eg007.worker(args);
    }
    catch (error) {
        let errorBody = error && error.response && error.response.body, 
        // we can pull the DocuSign error code and message from the response body
        errorCode = errorBody && errorBody.errorCode, errorMessage = errorBody && errorBody.message;
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
eg007.worker = (args) => __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient), getEnvelopeDocumentP = args.makePromise(envelopesApi, "getDocument"), results = null;
    // Step 1. EnvelopeDocuments::get.
    // Exceptions will be caught by the calling function
    results = yield getEnvelopeDocumentP(args.accountId, args.envelopeDocuments.envelopeId, args.documentId, null);
    let docItem = args.envelopeDocuments.documents.find(item => item.documentId === args.documentId), docName = docItem.name, hasPDFsuffix = docName.substr(docName.length - 4).toUpperCase() === ".PDF", pdfFile = hasPDFsuffix;
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
    }
    else if (docItem.type === "zip") {
        mimetype = "application/zip";
    }
    else {
        mimetype = "application/octet-stream";
    }
    return { mimetype: mimetype, docName: docName, fileBytes: results };
});
// ***DS.worker.end ***DS.snippet.1.end
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMDcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQzFCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sRUFDOUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFDaEMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM3QixNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ25CLEVBQUUsR0FBRyxPQUFPLEVBQUUsMEJBQTBCO0FBQ3hDLGdCQUFnQixHQUFHLHNCQUFzQixFQUN6QyxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7QUFDdkI7O0dBRUc7QUFDSCxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQ2pDLHFFQUFxRTtJQUNyRSxrRUFBa0U7SUFDbEUsaUVBQWlFO0lBQ2pFLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDL0MsSUFBSSxPQUFPLEVBQUU7UUFDWCxJQUFJLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQ25ELGVBQWUsQ0FBQztRQUNsQixJQUFJLGlCQUFpQixFQUFFO1lBQ3JCLDJCQUEyQjtZQUMzQixlQUFlLEdBQUcsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUMvRztRQUNE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