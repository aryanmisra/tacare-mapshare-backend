"use strict";
/**
 * @file
 * Example 010: Send envelope with multipart mime
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
  dsConfig = require("../../dsconfig.js").config,
  rp = require("request-promise-native"),
  validator = require("validator");
const eg010 = exports,
  eg = "eg010", // This example reference.
  mustAuthenticate = "/ds/mustAuthenticate",
  minimumBufferMin = 3,
  demoDocsPath = path.resolve(__dirname, "../../demo_documents"),
  doc2File = "World_Wide_Corp_Battle_Plan_Trafalgar.docx",
  doc3File = "World_Wide_Corp_lorem.pdf";
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
      csrfToken: req.csrfToken(),
      title: "Send envelope with multipart mime",
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
 * Create envelope using multipart and sending documents in binary
 * @param {object} req Request obj
 * @param {object} res Response obj
 */
eg010.createController = (req, res) =>
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
    let body = req.body,
      // Additional data validation might also be appropriate
      signerEmail = validator.escape(body.signerEmail),
      signerName = validator.escape(body.signerName),
      ccEmail = validator.escape(body.ccEmail),
      ccName = validator.escape(body.ccName),
      envelopeArgs = {
        signerEmail: signerEmail,
        signerName: signerName,
        ccEmail: ccEmail,
        ccName: ccName,
      },
      accountId = req.dsAuthCodeGrant.getAccountId(),
      args = {
        basePath: (basePath = req.dsAuthCodeGrant.getBasePath()),
        accessToken: req.dsAuthCodeGrant.getAccessToken(),
        accountId: accountId,
        envelopeArgs: envelopeArgs,
        demoDocsPath: demoDocsPath,
        doc2File: doc2File,
        doc3File: doc3File,
      },
      results = null;
    try {
      results = yield eg010.worker(args);
    } catch (error) {
      let errorBody = error && error.response && error.response.body;
      // Since we're using the request library at a low level, the body
      // is not automatically JSON parsed.
      try {
        if (errorBody) {
          errorBody = JSON.parse(errorBody);
        }
      } catch (e) {}
      // we can pull the DocuSign error code and message from the response body
      let errorCode = errorBody && errorBody.errorCode,
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
eg010.worker = args =>
  __awaiter(void 0, void 0, void 0, function* () {
    // Step 1. Make the envelope JSON request body
    let envelopeJSON = makeEnvelopeJSON(args.envelopeArgs),
      results = null;
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
    let CRLF = "\r\n",
      boundary = "multipartboundary_multipartboundary",
      hyphens = "--",
      reqBody;
    reqBody = Buffer.from(
      [
        hyphens,
        boundary,
        CRLF,
        "Content-Type: application/json",
        CRLF,
        "Content-Disposition: form-data",
        CRLF,
        CRLF,
        JSON.stringify(envelopeJSON, null, "    "),
      ].join("")
    );
    // Loop to add the documents.
    // See section Multipart Form Requests on page https://developers.docusign.com/esign-rest-api/guides/requests-and-responses
    documents.forEach(d => {
      reqBody = Buffer.concat([
        reqBody,
        Buffer.from(
          [
            CRLF,
            hyphens,
            boundary,
            CRLF,
            `Content-Type: ${d.mime}`,
            CRLF,
            `Content-Disposition: file; filename="${d.filename}";documentid=${d.documentId}`,
            CRLF,
            CRLF,
          ].join("")
        ),
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
  let doc1 = {},
    doc2 = {},
    doc3 = {};
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
    },
    signHere2 = {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMTAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMTAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQ3RCLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ3hCLFFBQVEsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxNQUFNLEVBQzlDLEVBQUUsR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsRUFDdEMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FDakM7QUFFTCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ2YsRUFBRSxHQUFHLE9BQU8sQ0FBQywwQkFBMEI7RUFDdkMsZ0JBQWdCLEdBQUcsc0JBQXNCLEVBQ3pDLGdCQUFnQixHQUFHLENBQUMsRUFDcEIsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLHNCQUFzQixDQUFDLEVBQzlELFFBQVEsR0FBRyw0Q0FBNEMsRUFDdkQsUUFBUSxHQUFHLDJCQUEyQixDQUN2QztBQUVMOztHQUVHO0FBQ0gsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtJQUMvQixxRUFBcUU7SUFDckUsa0VBQWtFO0lBQ2xFLGlFQUFpRTtJQUNqRSxJQUFJLE9BQU8sR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQy9DLElBQUksT0FBTyxFQUFFO1FBQ1QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRTtZQUMvQixTQUFTLEVBQUUsR0FBRyxDQUFDLFNBQVMsRUFBRTtZQUMxQixLQUFLLEVBQUUsbUNBQW1DO1lBQzFDLE1BQU0sRUFBRSxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7WUFDN0QsYUFBYSxFQUFFLFFBQVEsQ0FBQyxhQUFhLEdBQUcsRUFBRTtZQUMxQyxPQUFPLEVBQUUsUUFBUSxDQUFDLGFBQWE7U0FDbEMsQ0FBQyxDQUFDO0tBQ047U0FBTTtRQUNILHdFQUF3RTtRQUN4RSxHQUFHLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ2xDO0FBQ0wsQ0FBQyxDQUFBO0FBRUQ7Ozs7R0FJRztBQUNILEtBQUssQ0FBQyxnQkFBZ0IsR0FBRyxDQUFPLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtJQUN4QywwQkFBMEI7SUFDMUIsb0RBQW9EO0lBQ3BELHVEQUF1RDtJQUN2RCxJQUFJLE9BQU8sR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQy9ELElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDVixHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxxQ0FBcUMsQ0FBQyxDQUFDO1FBQ3pELDREQUE0RDtRQUM1RCwwQ0FBMEM7UUFDMUMsMERBQTBEO1FBQzFELG9EQUFvRDtRQUNwRCxrQkFBa0I7UUFDbEIsR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ25DLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUNsQztJQUVELGlDQUFpQztJQUNqQyxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSTtJQUNmLHVEQUF1RDtNQUNyRCxXQUFXLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQ2hELFVBQVUsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFDOUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUN4QyxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQ3RDLFlBQVksR0FBRztRQUNiLFdBQVcsRUFBRSxXQUFXO1FBQ3hCLFVBQVUsRUFBRSxVQUFVO1FBQ3RCLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLE1BQU0sRUFBRSxNQUFNO0tBQ2pCLEVBQ0MsU0FBUyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFLEVBQzlDLElBQUksR0FBRztRQUNMLFFBQVEsRUFBRSxRQUFRLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUU7UUFDdEQsV0FBVyxFQUFFLEdBQUcsQ0FBQyxlQUFlLENBQUMsY0FBYyxFQUFFO1FBQ2pELFNBQVMsRUFBRSxTQUFTO1FBQ3BCLFlBQVksRUFBRSxZQUFZO1FBQzFCLFlBQVksRUFBRSxZQUFZO1FBQzFCLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLFFBQVEsRUFBRSxRQUFRO0tBQ3JCLEVBQ0MsT0FBTyxHQUFHLElBQUksQ0FDZjtJQUVMLElBQUk7UUFDQSxPQUFPLEdBQUcsTUFBTSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ3JDO0lBQ0QsT0FBTyxLQUFLLEVBQUU7UUFDVixJQUFJLFNBQVMsR0FBRyxLQUFLLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQTtRQUM5RCxpRUFBaUU7UUFDakUsb0NBQW9DO1FBQ3BDLElBQUk7WUFDQSxJQUFJLFNBQVMsRUFBRTtnQkFBRSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQTthQUFFO1NBQ3ZEO1FBQ0QsT0FBTyxDQUFDLEVBQUU7WUFBRSxDQUFDO1NBQUU7UUFDZix5RUFBeUU7UUFDekUsSUFBSSxTQUFTLEdBQUcsU0FBUyxJQUFJLFNBQVMsQ0FBQyxTQUFTLEVBQzFDLFlBQVksR0FBRyxTQUFTLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FDOUM7UUFDTCxvRUFBb0U7UUFDcEUsa0NBQWtDO1FBQ2xDLEdBQUcsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO0tBQy9GO0lBQ0QsSUFBSSxPQUFPLEVBQUU7UUFDVCxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsa0NBQWtDO1FBQy9FLDJCQUEyQjtRQUMzQixHQUFHLENBQUMsTUFBTSxDQUFDLG9CQUFvQixFQUFFO1lBQzdCLEtBQUssRUFBRSxlQUFlO1lBQ3RCLEVBQUUsRUFBRSxlQUFlO1lBQ25CLE9BQU8sRUFBRSwyREFBMkQsT0FBTyxDQUFDLFVBQVUsR0FBRztTQUM1RixDQUFDLENBQUM7S0FDTjtBQUNMLENBQUMsQ0FBQSxDQUFBO0FBRUQ7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0gsMkNBQTJDO0FBQzNDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBTyxJQUFJLEVBQUUsRUFBRTtJQUUxQiw4Q0FBOEM7SUFDOUMsSUFBSSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUNoRCxPQUFPLEdBQUcsSUFBSSxDQUNmO0lBRUwsNkNBQTZDO0lBQzdDLG9DQUFvQztJQUNwQyxtRUFBbUU7SUFDbkUsSUFBSSxTQUFTLEdBQUc7UUFDWjtZQUNJLElBQUksRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtZQUMzRCxVQUFVLEVBQUUsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVO1lBQ2hELEtBQUssRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztTQUN0QztRQUNEO1lBQ0ksSUFBSSxFQUFFLHlFQUF5RTtZQUMvRSxRQUFRLEVBQUUsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO1lBQ3hDLFVBQVUsRUFBRSxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVU7WUFDaEQsS0FBSyxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN6RTtRQUNEO1lBQ0ksSUFBSSxFQUFFLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7WUFDakUsVUFBVSxFQUFFLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVTtZQUNoRCxLQUFLLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3pFO0tBQ0osQ0FBQztJQUVGLG9DQUFvQztJQUNwQyxJQUFJLElBQUksR0FBRyxNQUFNLEVBQ1gsUUFBUSxHQUFHLHFDQUFxQyxFQUNoRCxPQUFPLEdBQUcsSUFBSSxFQUNkLE9BQU8sQ0FDUjtJQUVMLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2xCLE9BQU8sRUFBRSxRQUFRO1FBQ2pCLElBQUksRUFBRSxnQ0FBZ0M7UUFDdEMsSUFBSSxFQUFFLGdDQUFnQztRQUN0QyxJQUFJO1FBQ0osSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUM7S0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FDN0QsQ0FBQztJQUVGLDZCQUE2QjtJQUM3QiwySEFBMkg7SUFDM0gsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNsQixPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUMxQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVE7Z0JBQ3ZCLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLElBQUksRUFBRTtnQkFDL0IsSUFBSSxFQUFFLHdDQUF3QyxDQUFDLENBQUMsUUFBUSxnQkFBZ0IsQ0FBQyxDQUFDLFVBQVUsRUFBRTtnQkFDdEYsSUFBSTtnQkFDSixJQUFJO2FBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUN6QyxDQUFBO0lBQ0wsQ0FBQyxDQUFDLENBQUE7SUFDRix1QkFBdUI7SUFDdkIsT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPO1FBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXJFLElBQUksT0FBTyxHQUFHO1FBQ1YsTUFBTSxFQUFFLE1BQU07UUFDZCxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxnQkFBZ0IsSUFBSSxDQUFDLFNBQVMsWUFBWTtRQUMvRCxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRTtRQUNsQyxPQUFPLEVBQUU7WUFDTCxNQUFNLEVBQUUsa0JBQWtCO1lBQzFCLGNBQWMsRUFDVixpQ0FBaUMsUUFBUSxFQUFFO1NBQ2xEO1FBQ0QsSUFBSSxFQUFFLE9BQU87S0FDaEIsQ0FBQztJQUVGLDRDQUE0QztJQUM1QyxvREFBb0Q7SUFDcEQsT0FBTyxHQUFHLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRTVCLG9FQUFvRTtJQUNwRSxxQ0FBcUM7SUFDckMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUIsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQyxDQUFBLENBQUE7QUFDRCx1Q0FBdUM7QUFFdkMsd0JBQXdCO0FBQ3hCOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsSUFBSTtJQUMxQiw0Q0FBNEM7SUFDNUMsa0NBQWtDO0lBQ2xDLGlDQUFpQztJQUNqQyxFQUFFO0lBQ0YsbUNBQW1DO0lBQ25DLHVCQUF1QjtJQUN2QixtQkFBbUI7SUFDbkIsaURBQWlEO0lBQ2pELHVEQUF1RDtJQUV2RCxpQ0FBaUM7SUFDakMsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLE9BQU8sQ0FBQyxZQUFZLEdBQUcsK0JBQStCLENBQUM7SUFFdkQsb0JBQW9CO0lBQ3BCLElBQUksSUFBSSxHQUFHLEVBQUUsRUFDUCxJQUFJLEdBQUcsRUFBRSxFQUNULElBQUksR0FBRyxFQUFFLENBQ1Y7SUFFTCxJQUFJLENBQUMsSUFBSSxHQUFHLHVCQUF1QixDQUFDLENBQUMseUNBQXlDO0lBQzlFLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLENBQUMsa0RBQWtEO0lBQy9FLElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUMsb0NBQW9DO0lBQzNELElBQUksQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDLENBQUMseUNBQXlDO0lBQ3BFLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDO0lBQzVCLElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDO0lBQ3RCLElBQUksQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDLENBQUMseUNBQXlDO0lBQ3BFLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0lBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDO0lBRXRCLG1FQUFtRTtJQUNuRSxPQUFPLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUV2QywrRUFBK0U7SUFDL0UsdURBQXVEO0lBQ3ZELElBQUksT0FBTyxHQUFHO1FBQ1YsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXO1FBQ3ZCLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVTtRQUNyQixXQUFXLEVBQUUsR0FBRztRQUNoQixZQUFZLEVBQUUsR0FBRztLQUNwQixDQUFDO0lBQ0Ysd0VBQXdFO0lBQ3hFLHNFQUFzRTtJQUN0RSx3REFBd0Q7SUFFeEQseUZBQXlGO0lBQ3pGLDJDQUEyQztJQUMzQyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDekIsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3ZCLEdBQUcsQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDO0lBQ3ZCLEdBQUcsQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDO0lBRXRCLGdFQUFnRTtJQUNoRSw2Q0FBNkM7SUFDN0MsRUFBRTtJQUNGLDREQUE0RDtJQUM1RCxnREFBZ0Q7SUFDaEQsaUVBQWlFO0lBQ2pFLHdEQUF3RDtJQUN4RCxJQUFJLFNBQVMsR0FBRztRQUNaLFlBQVksRUFBRSxpQkFBaUI7UUFDL0IsYUFBYSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsUUFBUTtRQUMxQyxhQUFhLEVBQUUsSUFBSTtLQUN0QixFQUNLLFNBQVMsR0FBRztRQUNWLFlBQVksRUFBRSxPQUFPO1FBQ3JCLGFBQWEsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVE7UUFDMUMsYUFBYSxFQUFFLElBQUk7S0FDdEIsQ0FDQTtJQUVMLHNDQUFzQztJQUN0QyxJQUFJLFdBQVcsR0FBRyxFQUFFLFlBQVksRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDO0lBQzNELE9BQU8sQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDO0lBRTNCLDRDQUE0QztJQUM1QyxJQUFJLFVBQVUsR0FBRyxFQUFFLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7SUFDN0QsT0FBTyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFFaEMsbUVBQW1FO0lBQ25FLHVFQUF1RTtJQUN2RSxPQUFPLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUV4QixPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDO0FBQ0Qsc0JBQXNCO0FBRXRCLHdCQUF3QjtBQUN4Qjs7Ozs7OztHQU9HO0FBRUgsU0FBUyxTQUFTLENBQUMsSUFBSTtJQUNuQixPQUFPOzs7Ozs7Ozs7Ozs7eUJBWWMsSUFBSSxDQUFDLFVBQVU7K0RBQ3VCLElBQUksQ0FBQyxXQUFXO2lFQUNkLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLE9BQU87Ozs7Ozs7O0dBUTFGLENBQUE7QUFDSCxDQUFDO0FBQ0Qsc0JBQXNCIn0=
