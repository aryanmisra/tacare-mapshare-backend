"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../../models/user"));
const path = require("path"), fs = require("fs-extra"), docusign = require("docusign-esign"), validator = require("validator"), dsConfig = require("../../dsconfig.js").config;
const eg002 = exports, eg = "eg002", // This example reference.
mustAuthenticate = "/ds/mustAuthenticate", minimumBufferMin = 3, demoDocsPath = path.resolve(__dirname, "../../demo_documents"), doc3File = "mapshare_template.pdf", dsReturnUrl = dsConfig.appUrl + "/ds-return", dsPingUrl = dsConfig.appUrl + "/"; // Url that will be pinged by the DocuSign Signing Ceremony via Ajax
eg002.getController = (req, res) => {
    // Check that the authentication token is ok with a long buffer time.
    // If needed, now is the best time to ask the user to authenticate
    // since they have not yet entered any information into the form.
    let tokenOK = req.dsAuthCodeGrant.checkToken();
    if (tokenOK) {
        res.render("pages/examples/eg002", {
            title: "Start Virtual Audit",
        });
    }
    else {
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
eg002.createController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const stakeholders = yield user_1.default.find({ userType: "user" }).exec;
    // Step 2. Call the worker method
    let body = req.body;
    console.log(body);
    // Additional data validation might also be appropriate
    let envelopeArgs = {
        stakeholders: stakeholders,
        status: "sent",
    }, accountId = req.dsAuthCodeGrant.getAccountId(), dsAPIclient = req.dsAuthCodeGrant.getDSApi(), args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        envelopeArgs: envelopeArgs,
    }, results = null;
    try {
        results = yield eg002.worker(args);
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
 *      <tt>status</tt>: envelope status: "sent" | "created"
 *      <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>ccEmail</tt>, <tt>ccName</tt>
 */
// ***DS.worker.start ***DS.snippet.1.start
eg002.worker = (args) => __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient), createEnvelopeP = args.makePromise(envelopesApi, "createEnvelope"), results = null;
    // Step 1. Make the envelope request body
    let envelope = makeEnvelope(args.envelopeArgs);
    // Step 2. call Envelopes::create API method
    // Exceptions will be caught by the calling function
    results = yield createEnvelopeP(args.accountId, { envelopeDefinition: envelope });
    let envelopeId = results.envelopeId;
    console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
    return { envelopeId: envelopeId };
});
// ***DS.worker.end ***DS.snippet.1.end
// ***DS.snippet.2.start
/**
 * Creates envelope
 * <br>Document 1: An HTML document.
 * <br>Document 2: A Word .docx document.
 * <br>Document 3: A PDF document.
 * <br>DocuSign will convert all of the documents to the PDF format.
 * <br>The recipients' field tags are placed using <b>anchor</b> strings.
 * @function
 * @param {Object} args parameters for the envelope:
 *   <tt>status</tt>: envelope status: "sent" | "created"
 *   <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>ccEmail</tt>, <tt>ccName</tt>
 * @returns {Envelope} An envelope definition
 * @private
 */
function makeEnvelope(args) {
    // document 1 (html) has tag **signature_1**
    // document 2 (docx) has tag /sn1/
    // document 3 (pdf) has tag /sn1/
    //
    // The envelope has two recipients.
    // recipient 1 - signer
    // recipient 2 - cc
    // The envelope will be sent first to the signer.
    // After it is signed, a copy is sent to the cc person.
    let pdfBytes;
    // read files from a local directory
    // The reads could raise an exception if the file is not available!
    pdfBytes = fs.readFileSync(path.resolve(demoDocsPath, doc3File));
    // create the envelope definition
    let env = new docusign.EnvelopeDefinition();
    env.emailSubject = "MapShare Virtual Audit: Review Required";
    // add the documents
    let doc3 = new docusign.Document(), doc3b64 = Buffer.from(pdfBytes).toString("base64");
    doc3.documentBase64 = doc3b64;
    doc3.name = "Virtual Audit Request"; // can be different from actual file name
    doc3.fileExtension = "pdf";
    doc3.documentId = "1";
    // The order in the docs array determines the order in the envelope
    env.documents = [doc3];
    // create a signer recipient to sign the document, identified by name and email
    // We're setting the parameters via the object creation
    let signers = [];
    let i = 1;
    args.stakeholders.forEach(stakeholder => {
        signers.push(docusign.Signer.constructFromObject({
            email: stakeholder.email,
            name: stakeholder.firstName + " " + stakeholder.lastName,
            recipientId: i.toString(),
            routingOrder: i.toString(),
        }));
        i += 1;
    });
    let signer1 = docusign.Signer.constructFromObject({
        email: args.signerEmail,
        name: args.signerName,
        recipientId: "1",
        routingOrder: "1",
    });
    // Create signHere fields (also known as tabs) on the documents,
    // We're using anchor (autoPlace) positioning
    //
    // The DocuSign platform searches throughout your envelope's
    // documents for matching anchor strings. So the
    // signHere2 tab will be used in both document 2 and 3 since they
    // use the same anchor string for their "signer 1" tabs.
    let signHere1 = docusign.SignHere.constructFromObject({
        anchorString: "**signature_1**",
        anchorYOffset: "10",
        anchorUnits: "pixels",
        anchorXOffset: "20",
    });
    // Tabs are set per recipient / signer
    let signer1Tabs = docusign.Tabs.constructFromObject({
        signHereTabs: [signHere1],
    });
    signer1.tabs = signer1Tabs;
    // Add the recipients to the envelope object
    let recipients = docusign.Recipients.constructFromObject({
        signers: [signer1],
        carbonCopies: [],
    });
    env.recipients = recipients;
    // Request that the envelope be sent by setting |status| to "sent".
    // To request that the envelope be created as a draft, set to "created"
    env.status = args.status;
    return env;
}
// ***DS.snippet.2.end
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMDIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2REFBcUM7QUFJckMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUMxQixFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUN4QixRQUFRLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQ3BDLFNBQVMsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQ2hDLFFBQVEsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDakQsTUFBTSxLQUFLLEdBQUcsT0FBTyxFQUNuQixFQUFFLEdBQUcsT0FBTyxFQUFFLDBCQUEwQjtBQUN4QyxnQkFBZ0IsR0FBRyxzQkFBc0IsRUFDekMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUNwQixZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsc0JBQXNCLENBQUMsRUFDOUQsUUFBUSxHQUFHLHVCQUF1QixFQUNsQyxXQUFXLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxZQUFZLEVBQzVDLFNBQVMsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLG9FQUFvRTtBQUV6RyxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQ2pDLHFFQUFxRTtJQUNyRSxrRUFBa0U7SUFDbEUsaUVBQWlFO0lBQ2pFLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDL0MsSUFBSSxPQUFPLEVBQUU7UUFDWCxHQUFHLENBQUMsTUFBTSxDQUFDLHNCQUFzQixFQUFFO1lBQ2pDLEtBQUssRUFBRSxxQkFBcUI7U0FDN0IsQ0FBQyxDQUFDO0tBQ0o7U0FBTTtRQUNMLHdFQUF3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