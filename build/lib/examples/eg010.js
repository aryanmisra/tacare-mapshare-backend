"use strict";
/**
 * @file
 * Example 010: Send envelope with multipart mime
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
const path = require("path"), fs = require("fs-extra"), dsConfig = require("../../dsconfig.js").config, rp = require("request-promise-native"), validator = require("validator");
const eg010 = exports, eg = "eg010", // This example reference.
mustAuthenticate = "/ds/mustAuthenticate", minimumBufferMin = 3, demoDocsPath = path.resolve(__dirname, "../../demo_documents"), doc2File = "World_Wide_Corp_Battle_Plan_Trafalgar.docx", doc3File = "World_Wide_Corp_lorem.pdf";
/**
 * Form page for this application
 */
eg010.getController = (req, res) => {
    // Check that the authentication token is ok with a long buffer time.
    // If needed, now is the best time to ask the user to authenticate
    // since they have not yet entered any information into the form.
    let tokenOK = req.dsAuthCodeGrant.checkToken();
    if (tokenOK) {
        res.render("pages/examples/eg010", {
            title: "Send envelope with multipart mime",
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
 * Create envelope using multipart and sending documents in binary
 * @param {object} req Request obj
 * @param {object} res Response obj
 */
eg010.createController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    }, accountId = req.dsAuthCodeGrant.getAccountId(), args = {
        basePath: (basePath = req.dsAuthCodeGrant.getBasePath()),
        accessToken: req.dsAuthCodeGrant.getAccessToken(),
        accountId: accountId,
        envelopeArgs: envelopeArgs,
        demoDocsPath: demoDocsPath,
        doc2File: doc2File,
        doc3File: doc3File,
    }, results = null;
    try {
        results = yield eg010.worker(args);
    }
    catch (error) {
        let errorBody = error && error.response && error.response.body;
        // Since we're using the request library at a low level, the body
        // is not automatically JSON parsed.
        try {
            if (errorBody) {
                errorBody = JSON.parse(errorBody);
            }
        }
        catch (e) { }
        // we can pull the DocuSign error code and message from the response body
        let errorCode = errorBody && errorBody.errorCode, errorMessage = errorBody && errorBody.message;
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
 * This function does the work of creating the envelope by using
 * the API directly with multipart mime
 * @param {object} args An object with the following elements: <br/>
 *   <tt>accountId</tt>: Current account Id <br/>
 *   <tt> basePath</tt>: base path for making API call <br/>
 *   <tt> accessToken</tt>: a valid access token <br/>
 *   <tt>demoDocsPath</tt>: relative path for the demo docs <br/>
 *   <tt>doc2File: file name for doc 2 <br/>
 *   <tt>doc3File: file name for doc 3 <br/>
 *   <tt>envelopeArgs</tt>: envelopeArgs, an object with elements <br/>
 *      <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>ccEmail</tt>, <tt>ccName</tt>
 */
// ***DS.worker.start ***DS.snippet.1.start
eg010.worker = (args) => __awaiter(void 0, void 0, void 0, function* () {
    // Step 1. Make the envelope JSON request body
    let envelopeJSON = makeEnvelopeJSON(args.envelopeArgs), results = null;
    // Step 2. Gather documents and their headers
    // Read files from a local directory
    // The reads could raise an exception if the file is not available!
    let documents = [
        {
            mime: "text/html",
            filename: envelopeJSON.documents[0].name,
            documentId: envelopeJSON.documents[0].documentId,
            bytes: document1(args.envelopeArgs),
        },
        {
            mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename: envelopeJSON.documents[1].name,
            documentId: envelopeJSON.documents[1].documentId,
            bytes: fs.readFileSync(path.resolve(args.demoDocsPath, args.doc2File)),
        },
        {
            mime: "application/pdf",
            filename: envelopeJSON.documents[2].name,
            documentId: envelopeJSON.documents[2].documentId,
            bytes: fs.readFileSync(path.resolve(args.demoDocsPath, args.doc3File)),
        },
    ];
    // Step 3. Create the multipart body
    let CRLF = "\r\n", boundary = "multipartboundary_multipartboundary", hyphens = "--", reqBody;
    reqBody = Buffer.from([
        hyphens,
        boundary,
        CRLF,
        "Content-Type: application/json",
        CRLF,
        "Content-Disposition: form-data",
        CRLF,
        CRLF,
        JSON.stringify(envelopeJSON, null, "    "),
    ].join(""));
    // Loop to add the documents.
    // See section Multipart Form Requests on page https://developers.docusign.com/esign-rest-api/guides/requests-and-responses
    documents.forEach(d => {
        reqBody = Buffer.concat([
            reqBody,
            Buffer.from([
                CRLF,
                hyphens,
                boundary,
                CRLF,
                `Content-Type: ${d.mime}`,
                CRLF,
                `Content-Disposition: file; filename="${d.filename}";documentid=${d.documentId}`,
                CRLF,
                CRLF,
            ].join("")),
            Buffer.from(d.bytes),
        ]);
    });
    // Add closing boundary
    reqBody = Buffer.concat([reqBody, Buffer.from([CRLF, hyphens, boundary, hyphens, CRLF].join(""))]);
    let options = {
        method: "POST",
        uri: `${args.basePath}/v2/accounts/${args.accountId}/envelopes`,
        auth: { bearer: args.accessToken },
        headers: {
            Accept: "application/json",
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body: reqBody,
    };
    // Step 2. call Envelopes::create API method
    // Exceptions will be caught by the calling function
    results = yield rp(options);
    // Since we're using the request library at a low level, the results
    // are not automatically JSON parsed.
    results = JSON.parse(results);
    return results;
});
// ***DS.worker.end ***DS.snippet.1.end
// ***DS.snippet.2.start
/**
 * Create envelope JSON
 * <br>Document 1: An HTML document.
 * <br>Document 2: A Word .docx document.
 * <br>Document 3: A PDF document.
 * <br>DocuSign will convert all of the documents to the PDF format.
 * <br>The recipients' field tags are placed using <b>anchor</b> strings.
 * @function
 * @param {Object} args parameters for the envelope:
 *   <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>ccEmail</tt>, <tt>ccName</tt>
 * @returns {Envelope} An envelope definition
 * @private
 */
function makeEnvelopeJSON(args) {
    // document 1 (html) has tag **signature_1**
    // document 2 (docx) has tag /sn1/
    // document 3 (pdf) has tag /sn1/
    //
    // The envelope has two recipients.
    // recipient 1 - signer
    // recipient 2 - cc
    // The envelope will be sent first to the signer.
    // After it is signed, a copy is sent to the cc person.
    // create the envelope definition
    let envJSON = {};
    envJSON.emailSubject = "Please sign this document set";
    // add the documents
    let doc1 = {}, doc2 = {}, doc3 = {};
    doc1.name = "Order acknowledgement"; // can be different from actual file name
    doc1.fileExtension = "html"; // Source data format. Signed docs are always pdf.
    doc1.documentId = "1"; // a label used to reference the doc
    doc2.name = "Battle Plan"; // can be different from actual file name
    doc2.fileExtension = "docx";
    doc2.documentId = "2";
    doc3.name = "Lorem Ipsum"; // can be different from actual file name
    doc3.fileExtension = "pdf";
    doc3.documentId = "3";
    // The order in the docs array determines the order in the envelope
    envJSON.documents = [doc1, doc2, doc3];
    // create a signer recipient to sign the document, identified by name and email
    // We're setting the parameters via the object creation
    let signer1 = {
        email: args.signerEmail,
        name: args.signerName,
        recipientId: "1",
        routingOrder: "1",
    };
    // routingOrder (lower means earlier) determines the order of deliveries
    // to the recipients. Parallel routing order is supported by using the
    // same integer as the order for two or more recipients.
    // create a cc recipient to receive a copy of the documents, identified by name and email
    // We're setting the parameters via setters
    let cc1 = {};
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
    let signHere1 = {
        anchorString: "**signature_1**",
        anchorYOffset: "10",
        anchorUnits: "pixels",
        anchorXOffset: "20",
    }, signHere2 = {
        anchorString: "/sn1/",
        anchorYOffset: "10",
        anchorUnits: "pixels",
        anchorXOffset: "20",
    };
    // Tabs are set per recipient / signer
    let signer1Tabs = { signHereTabs: [signHere1, signHere2] };
    signer1.tabs = signer1Tabs;
    // Add the recipients to the envelope object
    let recipients = { signers: [signer1], carbonCopies: [cc1] };
    envJSON.recipients = recipients;
    // Request that the envelope be sent by setting |status| to "sent".
    // To request that the envelope be created as a draft, set to "created"
    envJSON.status = "sent";
    return envJSON;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMTAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMTAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQzFCLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ3hCLFFBQVEsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxNQUFNLEVBQzlDLEVBQUUsR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsRUFDdEMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNuQyxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ25CLEVBQUUsR0FBRyxPQUFPLEVBQUUsMEJBQTBCO0FBQ3hDLGdCQUFnQixHQUFHLHNCQUFzQixFQUN6QyxnQkFBZ0IsR0FBRyxDQUFDLEVBQ3BCLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxFQUM5RCxRQUFRLEdBQUcsNENBQTRDLEVBQ3ZELFFBQVEsR0FBRywyQkFBMkIsQ0FBQztBQUN6Qzs7R0FFRztBQUNILEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDakMscUVBQXFFO0lBQ3JFLGtFQUFrRTtJQUNsRSxpRUFBaUU7SUFDakUsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUMvQyxJQUFJLE9BQU8sRUFBRTtRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUU7WUFDakMsS0FBSyxFQUFFLG1DQUFtQztZQUMxQyxNQUFNLEVBQUUsUUFBUSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO1lBQzdELGFBQWEsRUFBRSxRQUFRLENBQUMsYUFBYSxHQUFHLEVBQUU7WUFDMUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxhQUFhO1NBQ2hDLENBQUMsQ0FBQztLQUNKO1NBQU07UUFDTCx3RUFBd0U7UUFDeEUsR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ25DLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUNoQztBQUNILENBQUMsQ0FBQztBQUVGOzs7O0dBSUc7QUFDSCxLQUFLLENBQUMsZ0JBQWdCLEdBQUcsQ0FBTyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDMUMsMEJBQTBCO0lBQzFCLG9EQUFvRDtJQUNwRCx1REFBdUQ7SUFDdkQsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUMvRCxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUscUNBQXFDLENBQUMsQ0FBQztRQUN6RCwyREFBMkQ7UUFDM0QsMENBQTBDO1FBQzFDLDBEQUEwRDtRQUMxRCxtREFBbUQ7UUFDbkQsa0JBQWtCO1FBQ2xCLEdBQUcsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNuQyxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDaEM7SUFFRCxpQ0FBaUM7SUFDakMsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUk7SUFDakIsdURBQXVEO0lBQ3ZELFdBQVcsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFDaEQsVUFBVSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUM5QyxPQUFPLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQ3hDLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFDdEMsWUFBWSxHQUFHO1FBQ2IsV0FBVyxFQUFFLFdBQVc7UUFDeEIsVUFBVSxFQUFFLFVBQVU7UUFDdEIsT0FBTyxFQUFFLE9BQU87UUFDaEIsTUFBTSxFQUFFLE1BQU07S0FDZixFQUNELFNBQVMsR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxFQUM5QyxJQUFJLEdBQUc7UUFDTCxRQUFRLEVBQUUsQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN4RCxXQUFXLEVBQUUsR0FBRyxDQUFDLGVBQWUsQ0FBQyxjQUFjLEVBQUU7UUFDakQsU0FBUyxFQUFFLFNBQVM7UUFDcEIsWUFBWSxFQUFFLFlBQVk7UUFDMUIsWUFBWSxFQUFFLFlBQVk7UUFDMUIsUUFBUSxFQUFFLFFBQVE7UUFDbEIsUUFBUSxFQUFFLFFBQVE7S0FDbkIsRUFDRCxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBQ2pCLElBQUk7UUFDRixPQUFPLEdBQUcsTUFBTSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3BDO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxJQUFJLFNBQVMsR0FBRyxLQUFLLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztRQUMvRCxpRUFBaUU7UUFDakUsb0NBQW9DO1FBQ3BDLElBQUk7WUFDRixJQUFJLFNBQVMsRUFBRTtnQkFDYixTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUNuQztTQUNGO1FBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRztRQUNmLHlFQUF5RTtRQUN6RSxJQUFJLFNBQVMsR0FBRyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsRUFDOUMsWUFBWSxHQUFHLFNBQVMsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDO1FBQ2hELG1FQUFtRTtRQUNuRSxrQ0FBa0M7UUFDbEMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7S0FDN0Y7SUFDRCxJQUFJLE9BQU8sRUFBRTtRQUNYLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxpQ0FBaUM7UUFDOUUsMkJBQTJCO1FBQzNCLEdBQUcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLEVBQUU7WUFDL0IsS0FBSyxFQUFFLGVBQWU7WUFDdEIsRUFBRSxFQUFFLGVBQWU7WUFDbkIsT0FBTyxFQUFFLDJEQUEyRCxPQUFPLENBQUMsVUFBVSxHQUFHO1NBQzFGLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQyxDQUFBLENBQUM7QUFFRjs7Ozs7Ozs7Ozs7O0dBWUc7QUFDSCwyQ0FBMkM7QUFDM0MsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFNLElBQUksRUFBQyxFQUFFO0lBQzFCLDhDQUE4QztJQUM5QyxJQUFJLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQ3BELE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDakIsNkNBQTZDO0lBQzdDLG9DQUFvQztJQUNwQyxtRUFBbUU7SUFDbkUsSUFBSSxTQUFTLEdBQUc7UUFDZDtZQUNFLElBQUksRUFBRSxXQUFXO1lBQ2pCLFFBQVEsRUFBRSxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7WUFDeEMsVUFBVSxFQUFFLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVTtZQUNoRCxLQUFLLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7U0FDcEM7UUFDRDtZQUNFLElBQUksRUFBRSx5RUFBeUU7WUFDL0UsUUFBUSxFQUFFLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtZQUN4QyxVQUFVLEVBQUUsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVO1lBQ2hELEtBQUssRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDdkU7UUFDRDtZQUNFLElBQUksRUFBRSxpQkFBaUI7WUFDdkIsUUFBUSxFQUFFLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtZQUN4QyxVQUFVLEVBQUUsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVO1lBQ2hELEtBQUssRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDdkU7S0FDRixDQUFDO0lBRUYsb0NBQW9DO0lBQ3BDLElBQUksSUFBSSxHQUFHLE1BQU0sRUFDZixRQUFRLEdBQUcscUNBQXFDLEVBQ2hELE9BQU8sR0FBRyxJQUFJLEVBQ2QsT0FBTyxDQUFDO0lBRVYsT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQ25CO1FBQ0UsT0FBTztRQUNQLFFBQVE7UUFDUixJQUFJO1FBQ0osZ0NBQWdDO1FBQ2hDLElBQUk7UUFDSixnQ0FBZ0M7UUFDaEMsSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDO0tBQzNDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUNYLENBQUM7SUFFRiw2QkFBNkI7SUFDN0IsMkhBQTJIO0lBQzNILFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDcEIsT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDdEIsT0FBTztZQUNQLE1BQU0sQ0FBQyxJQUFJLENBQ1Q7Z0JBQ0UsSUFBSTtnQkFDSixPQUFPO2dCQUNQLFFBQVE7Z0JBQ1IsSUFBSTtnQkFDSixpQkFBaUIsQ0FBQyxDQUFDLElBQUksRUFBRTtnQkFDekIsSUFBSTtnQkFDSix3Q0FBd0MsQ0FBQyxDQUFDLFFBQVEsZ0JBQWdCLENBQUMsQ0FBQyxVQUFVLEVBQUU7Z0JBQ2hGLElBQUk7Z0JBQ0osSUFBSTthQUNMLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUNYO1lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0gsdUJBQXVCO0lBQ3ZCLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRW5HLElBQUksT0FBTyxHQUFHO1FBQ1osTUFBTSxFQUFFLE1BQU07UUFDZCxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxnQkFBZ0IsSUFBSSxDQUFDLFNBQVMsWUFBWTtRQUMvRCxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRTtRQUNsQyxPQUFPLEVBQUU7WUFDUCxNQUFNLEVBQUUsa0JBQWtCO1lBQzFCLGNBQWMsRUFBRSxpQ0FBaUMsUUFBUSxFQUFFO1NBQzVEO1FBQ0QsSUFBSSxFQUFFLE9BQU87S0FDZCxDQUFDO0lBRUYsNENBQTRDO0lBQzVDLG9EQUFvRDtJQUNwRCxPQUFPLEdBQUcsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFNUIsb0VBQW9FO0lBQ3BFLHFDQUFxQztJQUNyQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QixPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDLENBQUEsQ0FBQztBQUNGLHVDQUF1QztBQUV2Qyx3QkFBd0I7QUFDeEI7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0gsU0FBUyxnQkFBZ0IsQ0FBQyxJQUFJO0lBQzVCLDRDQUE0QztJQUM1QyxrQ0FBa0M7SUFDbEMsaUNBQWlDO0lBQ2pDLEVBQUU7SUFDRixtQ0FBbUM7SUFDbkMsdUJBQXVCO0lBQ3ZCLG1CQUFtQjtJQUNuQixpREFBaUQ7SUFDakQsdURBQXVEO0lBRXZELGlDQUFpQztJQUNqQyxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDakIsT0FBTyxDQUFDLFlBQVksR0FBRywrQkFBK0IsQ0FBQztJQUV2RCxvQkFBb0I7SUFDcEIsSUFBSSxJQUFJLEdBQUcsRUFBRSxFQUNYLElBQUksR0FBRyxFQUFFLEVBQ1QsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNaLElBQUksQ0FBQyxJQUFJLEdBQUcsdUJBQXVCLENBQUMsQ0FBQyx5Q0FBeUM7SUFDOUUsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsQ0FBQyxrREFBa0Q7SUFDL0UsSUFBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQyxvQ0FBb0M7SUFDM0QsSUFBSSxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsQ0FBQyx5Q0FBeUM7SUFDcEUsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7SUFDNUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7SUFDdEIsSUFBSSxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsQ0FBQyx5Q0FBeUM7SUFDcEUsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7SUFDM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7SUFFdEIsbUVBQW1FO0lBQ25FLE9BQU8sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRXZDLCtFQUErRTtJQUMvRSx1REFBdUQ7SUFDdkQsSUFBSSxPQUFPLEdBQUc7UUFDWixLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVc7UUFDdkIsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO1FBQ3JCLFdBQVcsRUFBRSxHQUFHO1FBQ2hCLFlBQVksRUFBRSxHQUFHO0tBQ2xCLENBQUM7SUFDRix3RUFBd0U7SUFDeEUsc0VBQXNFO0lBQ3RFLHdEQUF3RDtJQUV4RCx5RkFBeUY7SUFDekYsMkNBQTJDO0lBQzNDLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN6QixHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDdkIsR0FBRyxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUM7SUFDdkIsR0FBRyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUM7SUFFdEIsZ0VBQWdFO0lBQ2hFLDZDQUE2QztJQUM3QyxFQUFFO0lBQ0YsNERBQTREO0lBQzVELGdEQUFnRDtJQUNoRCxpRUFBaUU7SUFDakUsd0RBQXdEO0lBQ3hELElBQUksU0FBUyxHQUFHO1FBQ2QsWUFBWSxFQUFFLGlCQUFpQjtRQUMvQixhQUFhLEVBQUUsSUFBSTtRQUNuQixXQUFXLEVBQUUsUUFBUTtRQUNyQixhQUFhLEVBQUUsSUFBSTtLQUNwQixFQUNDLFNBQVMsR0FBRztRQUNWLFlBQVksRUFBRSxPQUFPO1FBQ3JCLGFBQWEsRUFBRSxJQUFJO1FBQ25CLFdBQVcsRUFBRSxRQUFRO1FBQ3JCLGFBQWEsRUFBRSxJQUFJO0tBQ3BCLENBQUM7SUFDSixzQ0FBc0M7SUFDdEMsSUFBSSxXQUFXLEdBQUcsRUFBRSxZQUFZLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQztJQUMzRCxPQUFPLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQztJQUUzQiw0Q0FBNEM7SUFDNUMsSUFBSSxVQUFVLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO0lBQzdELE9BQU8sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO0lBRWhDLG1FQUFtRTtJQUNuRSx1RUFBdUU7SUFDdkUsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFFeEIsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQUNELHNCQUFzQjtBQUV0Qix3QkFBd0I7QUFDeEI7Ozs7Ozs7R0FPRztBQUVILFNBQVMsU0FBUyxDQUFDLElBQUk7SUFDckIsT0FBTzs7Ozs7Ozs7Ozs7O3lCQVlnQixJQUFJLENBQUMsVUFBVTsrREFDdUIsSUFBSSxDQUFDLFdBQVc7aUVBQ2QsSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsT0FBTzs7Ozs7Ozs7R0FRMUYsQ0FBQztBQUNKLENBQUM7QUFDRCxzQkFBc0IifQ==