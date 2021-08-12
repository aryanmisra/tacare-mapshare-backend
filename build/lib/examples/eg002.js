"use strict";
/**
 * @file
 * Example 002: Remote signer, cc, envelope has three documents
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
const eg002 = exports,
  eg = "eg002", // This example reference.
  mustAuthenticate = "/ds/mustAuthenticate",
  minimumBufferMin = 3,
  demoDocsPath = path.resolve(__dirname, "../../demo_documents"),
  doc2File = "World_Wide_Corp_Battle_Plan_Trafalgar.docx",
  doc3File = "World_Wide_Corp_lorem.pdf",
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
      title: "Signing request by email",
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
eg002.createController = (req, res) =>
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
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        envelopeArgs: envelopeArgs,
      },
      results = null;
    try {
      results = yield eg002.worker(args);
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
 *      <tt>status</tt>: envelope status: "sent" | "created"
 *      <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>ccEmail</tt>, <tt>ccName</tt>
 */
// ***DS.worker.start ***DS.snippet.1.start
eg002.worker = args =>
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
  let doc2DocxBytes, doc3PdfBytes;
  // read files from a local directory
  // The reads could raise an exception if the file is not available!
  doc2DocxBytes = fs.readFileSync(path.resolve(demoDocsPath, doc2File));
  doc3PdfBytes = fs.readFileSync(path.resolve(demoDocsPath, doc3File));
  // create the envelope definition
  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = "Please sign this document set";
  // add the documents
  let doc1 = new docusign.Document(),
    doc2 = new docusign.Document(),
    doc3 = new docusign.Document(),
    doc1b64 = Buffer.from(document1(args)).toString("base64"),
    doc2b64 = Buffer.from(doc2DocxBytes).toString("base64"),
    doc3b64 = Buffer.from(doc3PdfBytes).toString("base64");
  doc1.documentBase64 = doc1b64;
  doc1.name = "Order acknowledgement"; // can be different from actual file name
  doc1.fileExtension = "html"; // Source data format. Signed docs are always pdf.
  doc1.documentId = "1"; // a label used to reference the doc
  doc2.documentBase64 = doc2b64;
  doc2.name = "Battle Plan"; // can be different from actual file name
  doc2.fileExtension = "docx";
  doc2.documentId = "2";
  doc3.documentBase64 = doc3b64;
  doc3.name = "Lorem Ipsum"; // can be different from actual file name
  doc3.fileExtension = "pdf";
  doc3.documentId = "3";
  // The order in the docs array determines the order in the envelope
  env.documents = [doc1, doc2, doc3];
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
    }),
    signHere2 = docusign.SignHere.constructFromObject({
      anchorString: "/sn1/",
      anchorYOffset: "10",
      anchorUnits: "pixels",
      anchorXOffset: "20",
    });
  // Tabs are set per recipient / signer
  let signer1Tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHere1, signHere2],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMDIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQ3RCLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ3hCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFDaEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sQ0FDL0M7QUFFTCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ2YsRUFBRSxHQUFHLE9BQU8sQ0FBQywwQkFBMEI7RUFDdkMsZ0JBQWdCLEdBQUcsc0JBQXNCLEVBQ3pDLGdCQUFnQixHQUFHLENBQUMsRUFDcEIsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLHNCQUFzQixDQUFDLEVBQzlELFFBQVEsR0FBRyw0Q0FBNEMsRUFDdkQsUUFBUSxHQUFHLDJCQUEyQixFQUN0QyxXQUFXLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxZQUFZLEVBQzVDLFNBQVMsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxvRUFBb0U7Q0FDdkc7QUFFTDs7R0FFRztBQUNILEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDL0IscUVBQXFFO0lBQ3JFLGtFQUFrRTtJQUNsRSxpRUFBaUU7SUFDakUsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUMvQyxJQUFJLE9BQU8sRUFBRTtRQUNULEdBQUcsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUU7WUFDL0IsS0FBSyxFQUFFLDBCQUEwQjtZQUNqQyxN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
