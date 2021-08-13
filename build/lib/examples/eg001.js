"use strict";
/**
 * @file
 * Example 001: Embedded Signing Ceremony
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
const path = require("path"), fs = require("fs-extra"), docusign = require("docusign-esign"), validator = require("validator"), dsConfig = require("../../dsconfig.js").config;
const eg001 = exports, eg = "eg001", // This example reference.
mustAuthenticate = "/ds/mustAuthenticate", minimumBufferMin = 3, signerClientId = 1000, // The id of the signer within this application.
demoDocsPath = path.resolve(__dirname, "../../demo_documents"), pdf1File = "World_Wide_Corp_lorem.pdf", dsReturnUrl = dsConfig.appUrl + "/ds-return", dsPingUrl = dsConfig.appUrl + "/"; // Url that will be pinged by the DocuSign Signing Ceremony via Ajax
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
    }
    else {
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
eg001.createController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    signerEmail = validator.escape(body.signerEmail), signerName = validator.escape(body.signerName), envelopeArgs = {
        signerEmail: signerEmail,
        signerName: signerName,
        signerClientId: signerClientId,
        dsReturnUrl: dsReturnUrl,
        dsPingUrl: dsPingUrl,
    }, accountId = req.dsAuthCodeGrant.getAccountId(), dsAPIclient = req.dsAuthCodeGrant.getDSApi(), args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        envelopeArgs: envelopeArgs,
    }, results = null;
    try {
        results = yield eg001.worker(args);
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
eg001.worker = (args) => __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient), createEnvelopeP = args.makePromise(envelopesApi, "createEnvelope"), results = null;
    // Step 1. Make the envelope request body
    let envelope = makeEnvelope(args.envelopeArgs);
    // Step 2. call Envelopes::create API method
    // Exceptions will be caught by the calling function
    results = yield createEnvelopeP(args.accountId, { envelopeDefinition: envelope });
    let envelopeId = results.envelopeId;
    console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
    // Step 3. create the recipient view, the Signing Ceremony
    let viewRequest = makeRecipientViewRequest(args.envelopeArgs), createRecipientViewP = args.makePromise(envelopesApi, "createRecipientView");
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
    let doc1 = new docusign.Document(), doc1b64 = Buffer.from(docPdfBytes).toString("base64");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMDEuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQzFCLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ3hCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFDaEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNqRCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ25CLEVBQUUsR0FBRyxPQUFPLEVBQUUsMEJBQTBCO0FBQ3hDLGdCQUFnQixHQUFHLHNCQUFzQixFQUN6QyxnQkFBZ0IsR0FBRyxDQUFDLEVBQ3BCLGNBQWMsR0FBRyxJQUFJLEVBQUUsZ0RBQWdEO0FBQ3ZFLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxFQUM5RCxRQUFRLEdBQUcsMkJBQTJCLEVBQ3RDLFdBQVcsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLFlBQVksRUFDNUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsb0VBQW9FO0FBQ3pHOztHQUVHO0FBQ0gsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtJQUNqQyxxRUFBcUU7SUFDckUsa0VBQWtFO0lBQ2xFLGlFQUFpRTtJQUNqRSxJQUFJLE9BQU8sR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQy9DLElBQUksT0FBTyxFQUFFO1FBQ1gsR0FBRyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRTtZQUNqQyxTQUFTLEVBQUUsR0FB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