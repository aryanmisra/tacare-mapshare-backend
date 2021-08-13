"use strict";
/**
 * @file
 * Example 013: Embedded Signing Ceremony from template with added document
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
const eg013 = exports, eg = "eg013", // This example reference.
mustAuthenticate = "/ds/mustAuthenticate", minimumBufferMin = 3, signerClientId = 1000, // The id of the signer within this application.
demoDocsPath = path.resolve(__dirname, "../../demo_documents"), dsReturnUrl = dsConfig.appUrl + "/ds-return", dsPingUrl = dsConfig.appUrl + "/"; // Url that will be pinged by the DocuSign Signing Ceremony via Ajax
/**
 * Form page for this application
 */
eg013.getController = (req, res) => {
    // Check that the authentication token is ok with a long buffer time.
    // If needed, now is the best time to ask the user to authenticate
    // since they have not yet entered any information into the form.
    let tokenOK = req.dsAuthCodeGrant.checkToken();
    if (tokenOK) {
        res.render("pages/examples/eg013", {
            title: "Embedded Signing Ceremony from template and extra doc",
            templateOk: req.session.templateId,
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
eg013.createController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        res.render("pages/examples/eg013", {
            title: "Embedded Signing Ceremony from template and extra doc",
            templateOk: req.session.templateId,
            source: dsConfig.githubExampleUrl + path.basename(__filename),
            documentation: dsConfig.documentation + eg,
            showDoc: dsConfig.documentation,
        });
    }
    // Step 2. Call the worker method
    let body = req.body, 
    // Additional data validation might also be appropriate
    signerEmail = validator.escape(body.signerEmail), signerName = validator.escape(body.signerName), ccEmail = validator.escape(body.ccEmail), ccName = validator.escape(body.ccName), item = validator.escape(body.item), quantity = validator.isInt(body.quantity) && body.quantity, envelopeArgs = {
        templateId: req.session.templateId,
        signerEmail: signerEmail,
        signerName: signerName,
        signerClientId: signerClientId,
        ccEmail: ccEmail,
        ccName: ccName,
        item: item,
        quantity: quantity,
        dsReturnUrl: dsReturnUrl,
        dsPingUrl: dsPingUrl,
    }, accountId = req.dsAuthCodeGrant.getAccountId(), dsAPIclient = req.dsAuthCodeGrant.getDSApi(), args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        envelopeArgs: envelopeArgs,
    }, results = null;
    try {
        results = yield eg013.worker(args);
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
 *      <tt>templateId</tt>, <tt>item</tt>, <tt>quantity</tt>
 *      <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>signerClientId</tt>
 *      <tt>ccEmail</tt>, <tt>ccName</tt>
 */
// ***DS.worker.start ***DS.snippet.1.start
eg013.worker = (args) => __awaiter(void 0, void 0, void 0, function* () {
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
 *      <tt>templateId</tt>, <tt>item</tt>, <tt>quantity</tt>
 *      <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>signerClientId</tt>
 *      <tt>ccEmail</tt>, <tt>ccName</tt>
 * @returns {Envelope} An envelope definition
 * @private
 */
function makeEnvelope(args) {
    // The envelope request object uses Composite Template to
    // include in the envelope:
    // 1. A template stored on the DocuSign service
    // 2. An additional document which is a custom HTML source document
    // Create Recipients for server template. Note that Recipients object
    // is used, not TemplateRole
    //
    // Create a signer recipient for the signer role of the server template
    let signer1 = docusign.Signer.constructFromObject({
        email: args.signerEmail,
        name: args.signerName,
        roleName: "signer",
        recipientId: "1",
        // Adding clientUserId transforms the template recipient
        // into an embedded recipient:
        clientUserId: args.signerClientId,
    });
    // Create the cc recipient
    let cc1 = docusign.CarbonCopy.constructFromObject({
        email: args.ccEmail,
        name: args.ccName,
        roleName: "cc",
        recipientId: "2",
    });
    // Recipients object:
    let recipientsServerTemplate = docusign.Recipients.constructFromObject({
        carbonCopies: [cc1],
        signers: [signer1],
    });
    // create a composite template for the Server Template
    let compTemplate1 = docusign.CompositeTemplate.constructFromObject({
        compositeTemplateId: "1",
        serverTemplates: [
            docusign.ServerTemplate.constructFromObject({
                sequence: "1",
                templateId: args.templateId,
            }),
        ],
        // Add the roles via an inlineTemplate
        inlineTemplates: [
            docusign.InlineTemplate.constructFromObject({
                sequence: "1",
                recipients: recipientsServerTemplate,
            }),
        ],
    });
    // The signer recipient for the added document with
    // a tab definition:
    let signHere1 = docusign.SignHere.constructFromObject({
        anchorString: "**signature_1**",
        anchorYOffset: "10",
        anchorUnits: "pixels",
        anchorXOffset: "20",
    });
    let signer1Tabs = docusign.Tabs.constructFromObject({
        signHereTabs: [signHere1],
    });
    // Signer definition for the added document
    let signer1AddedDoc = docusign.Signer.constructFromObject({
        email: args.signerEmail,
        name: args.signerName,
        clientId: args.signerClientId,
        roleName: "signer",
        recipientId: "1",
        tabs: signer1Tabs,
    });
    // Recipients object for the added document:
    let recipientsAddedDoc = docusign.Recipients.constructFromObject({
        carbonCopies: [cc1],
        signers: [signer1AddedDoc],
    });
    // create the HTML document
    let doc1 = new docusign.Document(), doc1b64 = Buffer.from(document1(args)).toString("base64");
    doc1.documentBase64 = doc1b64;
    doc1.name = "Appendix 1--Sales order"; // can be different from actual file name
    doc1.fileExtension = "html";
    doc1.documentId = "1";
    // create a composite template for the added document
    let compTemplate2 = docusign.CompositeTemplate.constructFromObject({
        compositeTemplateId: "2",
        // Add the recipients via an inlineTemplate
        inlineTemplates: [
            docusign.InlineTemplate.constructFromObject({
                sequence: "2",
                recipients: recipientsAddedDoc,
            }),
        ],
        document: doc1,
    });
    // create the envelope definition
    let env = docusign.EnvelopeDefinition.constructFromObject({
        status: "sent",
        compositeTemplates: [compTemplate1, compTemplate2],
    });
    return env;
}
// ***DS.snippet.2.end
// ***DS.snippet.3.start
/**
 * Creates document 1
 * @function
 * @private
 * @param {Object} args parameters for the envelope:
 *   <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>ccEmail</tt>, <tt>ccName</tt>
 * @returns {string} A document in HTML format
 */
function document1(args) {
    return `
    <!DOCTYPE html>
    <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family:sans-serif;margin-left:2em;">
        <h1 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
            color: darkblue;margin-bottom: 0;">World Wide Corp</h1>
        <h2 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
          margin-top: 0px;margin-bottom: 3.5em;font-size: 1em;
          color: darkblue;">Order Processing Division</h2>
        <h4>Ordered by ${args.signerName}</h4>
        <p style="margin-top:0em; margin-bottom:0em;">Email: ${args.signerEmail}</p>
        <p style="margin-top:0em; margin-bottom:0em;">Copy to: ${args.ccName}, ${args.ccEmail}</p>
        <p style="margin-top:3em; margin-bottom:0em;">Item: <b>${args.item}</b>, quantity: <b>${args.quantity}</b> at market price.</p>
        <p style="margin-top:3em;">
  Candy bonbon pastry jujubes lollipop wafer biscuit biscuit. Topping brownie sesame snaps sweet roll pie. Croissant danish biscuit soufflé caramels jujubes jelly. Dragée danish caramels lemon drops dragée. Gummi bears cupcake biscuit tiramisu sugar plum pastry. Dragée gummies applicake pudding liquorice. Donut jujubes oat cake jelly-o. Dessert bear claw chocolate cake gummies lollipop sugar plum ice cream gummies cheesecake.
        </p>
        <!-- Note the anchor tag for the signature field is in white. -->
        <h3 style="margin-top:3em;">Agreed: <span style="color:white;">**signature_1**/</span></h3>
        </body>
    </html>
  `;
}
// ***DS.snippet.3.end
// ***DS.snippet.4.start
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
// ***DS.snippet.4.end
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMTMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMTMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQzFCLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ3hCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFDaEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNqRCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ25CLEVBQUUsR0FBRyxPQUFPLEVBQUUsMEJBQTBCO0FBQ3hDLGdCQUFnQixHQUFHLHNCQUFzQixFQUN6QyxnQkFBZ0IsR0FBRyxDQUFDLEVBQ3BCLGNBQWMsR0FBRyxJQUFJLEVBQUUsZ0RBQWdEO0FBQ3ZFLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxFQUM5RCxXQUFXLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxZQUFZLEVBQzVDLFNBQVMsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLG9FQUFvRTtBQUN6Rzs7R0FFRztBQUNILEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDakMscUVBQXFFO0lBQ3JFLGtFQUFrRTtJQUNsRSxpRUFBaUU7SUFDakUsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUMvQyxJQUFJLE9BQU8sRUFBRTtRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUU7WUFDakMsS0FBSyxFQUFFLHVEQUF1RDtZQUM5RCxVQUFVLEVBQUUsR0FB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