"use strict";
/**
 * @file
 * Example 014: Remote signer, cc, envelope has an order form
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
const eg014 = exports, eg = "eg014", // This example reference.
mustAuthenticate = "/ds/mustAuthenticate", minimumBufferMin = 3, demoDocsPath = path.resolve(__dirname, "../../demo_documents"), doc1File = "order_form.html";
/**
 * Form page for this application
 */
eg014.getController = (req, res) => {
    // Check that the authentication token is ok with a long buffer time.
    // If needed, now is the best time to ask the user to authenticate
    // since they have not yet entered any information into the form.
    let tokenOK = req.dsAuthCodeGrant.checkToken();
    if (tokenOK) {
        res.render("pages/examples/eg014", {
            title: "Order form with payment by email",
            gatewayOk: dsConfig.gatewayAccountId && dsConfig.gatewayAccountId.length > 25,
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
 * Create the envelope
 * @param {object} req Request obj
 * @param {object} res Response obj
 */
eg014.createController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    signerEmail = validator.escape(body.signerEmail), signerName = validator.escape(body.signerName), ccEmail = validator.escape(body.ccEmail), ccName = validator.escape(body.ccName), envelopeArgs = {
        signerEmail: signerEmail,
        signerName: signerName,
        ccEmail: ccEmail,
        ccName: ccName,
        status: "sent",
        gatewayAccountId: dsConfig.gatewayAccountId,
        gatewayName: dsConfig.gatewayName,
        gatewayDisplayName: dsConfig.gatewayDisplayName,
    }, accountId = req.dsAuthCodeGrant.getAccountId(), dsAPIclient = req.dsAuthCodeGrant.getDSApi(), args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        envelopeArgs: envelopeArgs,
    }, results = null;
    try {
        results = yield eg014.worker(args);
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
 *      <tt>paymentGatewayId</tt>
 */
// ***DS.worker.start ***DS.snippet.1.start
eg014.worker = (args) => __awaiter(void 0, void 0, void 0, function* () {
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
 * <br>DocuSign will convert all of the documents to the PDF format.
 * <br>The recipients' field tags are placed using <b>anchor</b> strings.
 * @function
 * @param {Object} args parameters for the envelope:
 *   <tt>status</tt>: envelope status: "sent" | "created"
 *   <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>ccEmail</tt>, <tt>ccName</tt>
 *   <tt>paymentGatewayId</tt>
 * @returns {Envelope} An envelope definition
 * @private
 */
function makeEnvelope(args) {
    // document 1 (html) has multiple tags:
    // /l1q/ and /l2q/ -- quantities: drop down
    // /l1e/ and /l2e/ -- extended: payment lines
    // /l3t/ -- total -- formula
    //
    // The envelope has two recipients.
    // recipient 1 - signer
    // recipient 2 - cc
    // The envelope will be sent first to the signer.
    // After it is signed, a copy is sent to the cc person.
    ///////////////////////////////////////////////////////////////////
    //                                                               //
    // NOTA BENA: This method programmatically constructs the        //
    //            order form. For many use cases, it would be        //
    //            better to create the order form as a template      //
    //            using the DocuSign web tool as WYSIWYG             //
    //            form designer.                                     //
    //                                                               //
    ///////////////////////////////////////////////////////////////////
    // Order form constants
    let l1Name = "Harmonica", l1Price = 5, l1Description = `$${l1Price} each`, l2Name = "Xylophone", l2Price = 150, l2Description = `$${l2Price} each`, currencyMultiplier = 100;
    // read file from a local directory
    // The read could raise an exception if the file is not available!
    let doc1HTML1 = fs.readFileSync(path.resolve(demoDocsPath, doc1File), { encoding: "utf8" });
    // Substitute values into the HTML
    // Substitute for: {signerName}, {signerEmail}, {ccName}, {ccEmail}
    let doc1HTML2 = doc1HTML1
        .replace("{signerName}", args.signerName)
        .replace("{signerEmail}", args.signerEmail)
        .replace("{ccName}", args.ccName)
        .replace("{ccEmail}", args.ccEmail);
    // create the envelope definition
    let env = new docusign.EnvelopeDefinition();
    env.emailSubject = "Please complete your order";
    // add the documents
    let doc1 = new docusign.Document(), doc1b64 = Buffer.from(doc1HTML2).toString("base64");
    doc1.documentBase64 = doc1b64;
    doc1.name = "Order form"; // can be different from actual file name
    doc1.fileExtension = "html"; // Source data format. Signed docs are always pdf.
    doc1.documentId = "1"; // a label used to reference the doc
    env.documents = [doc1];
    // create a signer recipient to sign the document, identified by name and email
    // We're setting the parameters via the object creation
    let signer1 = docusign.Signer.constructFromObject({
        email: args.signerEmail,
        name: args.signerName,
        recipientId: "1",
        routingOrder: "1",
    });
    // routingOrder (lower means earlier) determines the order of deliveries
    // to the recipients. Parallel routing order is supported by using the
    // same integer as the order for two or more recipients.
    // create a cc recipient to receive a copy of the documents, identified by name and email
    // We're setting the parameters via setters
    let cc1 = new docusign.CarbonCopy();
    cc1.email = args.ccEmail;
    cc1.name = args.ccName;
    cc1.routingOrder = "2";
    cc1.recipientId = "2";
    // Create signHere fields (also known as tabs) on the documents,
    // We're using anchor (autoPlace) positioning
    let signHere1 = docusign.SignHere.constructFromObject({
        anchorString: "/sn1/",
        anchorYOffset: "10",
        anchorUnits: "pixels",
        anchorXOffset: "20",
    }), listItem0 = docusign.ListItem.constructFromObject({
        text: "none",
        value: "0",
    }), listItem1 = docusign.ListItem.constructFromObject({
        text: "1",
        value: "1",
    }), listItem2 = docusign.ListItem.constructFromObject({
        text: "2",
        value: "2",
    }), listItem3 = docusign.ListItem.constructFromObject({
        text: "3",
        value: "3",
    }), listItem4 = docusign.ListItem.constructFromObject({
        text: "4",
        value: "4",
    }), listItem5 = docusign.ListItem.constructFromObject({
        text: "5",
        value: "5",
    }), listItem6 = docusign.ListItem.constructFromObject({
        text: "6",
        value: "6",
    }), listItem7 = docusign.ListItem.constructFromObject({
        text: "7",
        value: "7",
    }), listItem8 = docusign.ListItem.constructFromObject({
        text: "8",
        value: "8",
    }), listItem9 = docusign.ListItem.constructFromObject({
        text: "9",
        value: "9",
    }), listItem10 = docusign.ListItem.constructFromObject({
        text: "10",
        value: "10",
    }), listl1q = docusign.List.constructFromObject({
        font: "helvetica",
        fontSize: "size11",
        anchorString: "/l1q/",
        anchorYOffset: "-10",
        anchorUnits: "pixels",
        anchorXOffset: "0",
        listItems: [listItem0, listItem1, listItem2, listItem3, listItem4, listItem5, listItem6, listItem7, listItem8, listItem9, listItem10],
        required: "true",
        tabLabel: "l1q",
    }), listl2q = docusign.List.constructFromObject({
        font: "helvetica",
        fontSize: "size11",
        anchorString: "/l2q/",
        anchorYOffset: "-10",
        anchorUnits: "pixels",
        anchorXOffset: "0",
        listItems: [listItem0, listItem1, listItem2, listItem3, listItem4, listItem5, listItem6, listItem7, listItem8, listItem9, listItem10],
        required: "true",
        tabLabel: "l2q",
    }), 
    // create two formula tabs for the extended price on the line items
    formulal1e = docusign.FormulaTab.constructFromObject({
        font: "helvetica",
        fontSize: "size11",
        anchorString: "/l1e/",
        anchorYOffset: "-8",
        anchorUnits: "pixels",
        anchorXOffset: "105",
        tabLabel: "l1e",
        formula: `[l1q] * ${l1Price}`,
        roundDecimalPlaces: "0",
        required: "true",
        locked: "true",
        disableAutoSize: "false",
    }), formulal2e = docusign.FormulaTab.constructFromObject({
        font: "helvetica",
        fontSize: "size11",
        anchorString: "/l2e/",
        anchorYOffset: "-8",
        anchorUnits: "pixels",
        anchorXOffset: "105",
        tabLabel: "l2e",
        formula: `[l2q] * ${l2Price}`,
        roundDecimalPlaces: "0",
        required: "true",
        locked: "true",
        disableAutoSize: "false",
    }), 
    // Formula for the total
    formulal3t = docusign.FormulaTab.constructFromObject({
        font: "helvetica",
        bold: "true",
        fontSize: "size12",
        anchorString: "/l3t/",
        anchorYOffset: "-8",
        anchorUnits: "pixels",
        anchorXOffset: "50",
        tabLabel: "l3t",
        formula: `[l1e] + [l2e]`,
        roundDecimalPlaces: "0",
        required: "true",
        locked: "true",
        disableAutoSize: "false",
    }), 
    // Payment line items
    paymentLineIteml1 = docusign.PaymentLineItem.constructFromObject({
        name: l1Name,
        description: l1Description,
        amountReference: "l1e",
    }), paymentLineIteml2 = docusign.PaymentLineItem.constructFromObject({
        name: l2Name,
        description: l2Description,
        amountReference: "l2e",
    }), paymentDetails = docusign.PaymentDetails.constructFromObject({
        gatewayAccountId: args.gatewayAccountId,
        currencyCode: "USD",
        gatewayName: args.gatewayName,
        gatewayDisplayName: args.gatewayDisplayName,
        lineItems: [paymentLineIteml1, paymentLineIteml2],
    }), 
    // Hidden formula for the payment itself
    formulaPayment = docusign.FormulaTab.constructFromObject({
        tabLabel: "payment",
        formula: `([l1e] + [l2e]) * ${currencyMultiplier}`,
        roundDecimalPlaces: "0",
        paymentDetails: paymentDetails,
        hidden: "true",
        required: "true",
        locked: "true",
        documentId: "1",
        pageNumber: "1",
        xPosition: "0",
        yPosition: "0",
    });
    // Tabs are set per recipient / signer
    let signer1Tabs = docusign.Tabs.constructFromObject({
        signHereTabs: [signHere1],
        listTabs: [listl1q, listl2q],
        formulaTabs: [formulal1e, formulal2e, formulal3t, formulaPayment],
    });
    signer1.tabs = signer1Tabs;
    // Add the recipients to the envelope object
    let recipients = docusign.Recipients.constructFromObject({
        signers: [signer1],
        carbonCopies: [cc1],
    });
    env.recipients = recipients;
    // Request that the envelope be sent by setting |status| to "sent".
    // To request that the envelope be created as a draft, set to "created"
    env.status = args.status;
    return env;
}
// ***DS.snippet.2.end
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMTQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMTQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQzFCLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ3hCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFDaEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNqRCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ25CLEVBQUUsR0FBRyxPQUFPLEVBQUUsMEJBQTBCO0FBQ3hDLGdCQUFnQixHQUFHLHNCQUFzQixFQUN6QyxnQkFBZ0IsR0FBRyxDQUFDLEVBQ3BCLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxFQUM5RCxRQUFRLEdBQUcsaUJBQWlCLENBQUM7QUFDL0I7O0dBRUc7QUFDSCxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQ2pDLHFFQUFxRTtJQUNyRSxrRUFBa0U7SUFDbEUsaUVBQWlFO0lBQ2pFLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDL0MsSUFBSSxPQUFPLEVBQUU7UUFDWCxHQUFHLENBQUMsTUFBTSxDQUFDLHNCQUFzQixFQUFFO1lBQ2pDLEtBQUssRUFBRSxrQ0FBa0M7WUFDekMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsSUFBSSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLEVBQUU7WUFDN0UsTUFBTSxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMs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