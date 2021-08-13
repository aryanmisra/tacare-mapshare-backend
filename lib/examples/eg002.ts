const path = require("path"),
    fs = require("fs-extra"),
    docusign = require("docusign-esign"),
    validator = require("validator"),
    dsConfig = require("../../dsconfig.js").config;
const eg002 = exports,
    eg = "eg002", // This example reference.
    mustAuthenticate = "/ds/mustAuthenticate",
    minimumBufferMin = 3,
    demoDocsPath = path.resolve(__dirname, "../../demo_documents"),
    doc3File = "mapshare_template.pdf",
    dsReturnUrl = dsConfig.appUrl + "/ds-return",
    dsPingUrl = dsConfig.appUrl + "/"; // Url that will be pinged by the DocuSign Signing Ceremony via Ajax
/**
 * Form page for this application
 */
eg002.getController = (req, res) => {
    // Check that the authentication token is ok with a long buffer time.
    // If needed, now is the best time to ask the user to authenticate
    // since they have not yet entered any information into the form.
    let tokenOK = req.dsAuthCodeGrant.checkToken();
    if (tokenOK) {

        res.render("pages/examples/eg002", {
            title: "Start Virtual Audit",
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
eg002.createController = async (req, res) => {
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
    let body = req.body;
    console.log(body);
    // Additional data validation might also be appropriate
    let signerEmail = validator.escape(body.signerEmail),
        signerName = validator.escape(body.signerName),
        ccEmail = validator.escape(body.ccEmail),
        ccName = validator.escape(body.ccName),
        envelopeArgs = {
            signerEmail: signerEmail,
            signerName: signerName,
            ccEmail: ccEmail,
            ccName: ccName,
            status: "sent",
        },
        accountId = req.dsAuthCodeGrant.getAccountId(),
        dsAPIclient = req.dsAuthCodeGrant.getDSApi(),
        args = {
            dsAPIclient: dsAPIclient,
            makePromise: req.dsAuthCodeGrant.makePromise, // this is a function
            accountId: accountId,
            envelopeArgs: envelopeArgs,
        },
        results = null;
    try {
        results = await eg002.worker(args);
    } catch (error) {
        let errorBody = error && error.response && error.response.body,
            // we can pull the DocuSign error code and message from the response body
            errorCode = errorBody && errorBody.errorCode,
            errorMessage = errorBody && errorBody.message;
        // In production, may want to provide customized error messages and
        // remediation advice to the user.
        res.render("pages/error", {err: error, errorCode: errorCode, errorMessage: errorMessage});
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
};

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
eg002.worker = async args => {
    let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient),
        createEnvelopeP = args.makePromise(envelopesApi, "createEnvelope"),
        results = null;
    // Step 1. Make the envelope request body
    let envelope = makeEnvelope(args.envelopeArgs);

    // Step 2. call Envelopes::create API method
    // Exceptions will be caught by the calling function
    results = await createEnvelopeP(args.accountId, {envelopeDefinition: envelope});
    let envelopeId = results.envelopeId;

    console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
    return {envelopeId: envelopeId};
};
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
    let doc3 = new docusign.Document(),
        doc3b64 = Buffer.from(pdfBytes).toString("base64");
    doc3.documentBase64 = doc3b64;
    doc3.name = "Virtual Audit Request"; // can be different from actual file name
    doc3.fileExtension = "pdf";
    doc3.documentId = "1";

    // The order in the docs array determines the order in the envelope
    env.documents = [doc3];

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
    })
    // Tabs are set per recipient / signer
    let signer1Tabs = docusign.Tabs.constructFromObject({
        signHereTabs: [signHere1],
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
