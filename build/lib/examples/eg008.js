"use strict";
/**
 * @file
 * Example 008: create a template if it doesn't already exist
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
  fs = require("fs-extra");
const eg008 = exports,
  eg = "eg008", // This example reference.
  mustAuthenticate = "/ds/mustAuthenticate",
  minimumBufferMin = 3,
  demoDocsPath = path.resolve(__dirname, "../../demo_documents"),
  docFile = "mapshare_template.pdf",
  templateName = "Example Signer and CC template";
/**
 * Form page for this application
 */
eg008.getController = (req, res) => {
  // Check that the authentication token is ok with a long buffer time.
  // If needed, now is the best time to ask the user to authenticate
  // since they have not yet entered any information into the form.
  let tokenOK = req.dsAuthCodeGrant.checkToken();
  if (tokenOK) {
    res.render("pages/examples/eg008", {
      title: "Create a template",
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
 * Create a template
 * @param {object} req Request obj
 * @param {object} res Response obj
 */
eg008.createController = (req, res) =>
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
    let accountId = req.dsAuthCodeGrant.getAccountId(),
      dsAPIclient = req.dsAuthCodeGrant.getDSApi(),
      args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        templateName: templateName,
      },
      results = null;
    try {
      results = yield eg008.worker(args);
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
      // Save the templateId in the session so they can be used in future examples
      req.session.templateId = results.templateId;
      let msg = results.createdNewTemplate ? "The template has been created!" : "The template already exists in your account.";
      res.render("pages/example_done", {
        title: "Template results",
        h1: "Template results",
        message: `${msg}<br/>Template name: ${results.templateName}, ID ${results.templateId}.`,
      });
    }
  });
/**
 * This function does the work of checking to see if the template exists and creating it if not.
 * @param {object} args An object with the following elements: <br/>
 *   <tt>dsAPIclient</tt>: The DocuSign API Client object, already set with an access token and base url <br/>
 *   <tt>makePromise</tt>: Function for promisfying an SDK method <br/>
 *   <tt>accountId</tt>: Current account Id <br/>
 *   <tt>templateName</tt>: The template's name <br/>
 */
// ***DS.worker.start ***DS.snippet.1.start
eg008.worker = args =>
  __awaiter(void 0, void 0, void 0, function* () {
    let templatesApi = new docusign.TemplatesApi(args.dsAPIclient),
      createTemplateP = args.makePromise(templatesApi, "createTemplate"),
      listTemplateP = args.makePromise(templatesApi, "listTemplates"),
      results = null,
      templateId = null, // the template that exists or will be created.
      resultsTemplateName = null,
      createdNewTemplate = null;
    // Step 1. See if the template already exists
    // Exceptions will be caught by the calling function
    results = yield listTemplateP(args.accountId, { searchText: args.templateName });
    if (results.resultSetSize > 0) {
      templateId = results.envelopeTemplates[0].templateId;
      resultsTemplateName = results.envelopeTemplates[0].name;
      createdNewTemplate = false;
    } else {
      // Template doesn't exist. Therefore create it...
      // Step 2 Create the template
      let templateReqObject = makeTemplate();
      results = yield createTemplateP(args.accountId, { envelopeTemplate: templateReqObject });
      templateId = results.templateId;
      resultsTemplateName = results.name;
      createdNewTemplate = true;
      //console.log(`template was created. TemplateId ${templateId}`);
    }
    return {
      templateId: templateId,
      templateName: resultsTemplateName,
      createdNewTemplate: createdNewTemplate,
    };
  });
/**
 * Creates the template request object
 * <br>Document 1: A PDF document.
 * @function
 * @returns {template} An template definition
 * @private
 */
function makeTemplate() {
  // document 1 (pdf) has tag /sn1/
  //
  // The template has two recipient roles.
  // recipient 1 - signer
  // recipient 2 - cc
  // The template will be sent first to the signer.
  // After it is signed, a copy is sent to the cc person.
  let docPdfBytes;
  // read file from a local directory
  // The reads could raise an exception if the file is not available!
  docPdfBytes = fs.readFileSync(path.resolve(demoDocsPath, docFile));
  // add the documents
  let doc = new docusign.Document(),
    docB64 = Buffer.from(docPdfBytes).toString("base64");
  doc.documentBase64 = docB64;
  doc.name = "Lorem Ipsum"; // can be different from actual file name
  doc.fileExtension = "pdf";
  doc.documentId = "1";
  // create a signer recipient to sign the document, identified by name and email
  // We're setting the parameters via the object creation
  let signer1 = docusign.Signer.constructFromObject({
    roleName: "signer",
    recipientId: "1",
    routingOrder: "1",
  });
  // routingOrder (lower means earlier) determines the order of deliveries
  // to the recipients. Parallel routing order is supported by using the
  // same integer as the order for two or more recipients.
  // create a cc recipient to receive a copy of the documents, identified by name and email
  // We're setting the parameters via setters
  let cc1 = new docusign.CarbonCopy();
  cc1.roleName = "cc";
  cc1.routingOrder = "2";
  cc1.recipientId = "2";
  // Create fields using absolute positioning:
  let signHere = docusign.SignHere.constructFromObject({
      documentId: "1",
      pageNumber: "1",
      xPosition: "191",
      yPosition: "148",
    }),
    check1 = docusign.Checkbox.constructFromObject({
      documentId: "1",
      pageNumber: "1",
      xPosition: "75",
      yPosition: "417",
      font: "helvetica",
      fontSize: "size14",
      tabLabel: "ckAuthorization",
    }),
    check2 = docusign.Checkbox.constructFromObject({
      documentId: "1",
      pageNumber: "1",
      xPosition: "75",
      yPosition: "447",
      font: "helvetica",
      fontSize: "size14",
      tabLabel: "ckAuthentication",
    }),
    check3 = docusign.Checkbox.constructFromObject({
      documentId: "1",
      pageNumber: "1",
      xPosition: "75",
      yPosition: "478",
      font: "helvetica",
      fontSize: "size14",
      tabLabel: "ckAgreement",
    }),
    check4 = docusign.Checkbox.constructFromObject({
      documentId: "1",
      pageNumber: "1",
      xPosition: "75",
      yPosition: "508",
      font: "helvetica",
      fontSize: "size14",
      tabLabel: "ckAcknowledgement",
    }),
    list1 = docusign.List.constructFromObject({
      documentId: "1",
      pageNumber: "1",
      xPosition: "142",
      yPosition: "291",
      font: "helvetica",
      fontSize: "size14",
      tabLabel: "list",
      required: "false",
      listItems: [
        docusign.ListItem.constructFromObject({ text: "Red", value: "red" }),
        docusign.ListItem.constructFromObject({ text: "Orange", value: "orange" }),
        docusign.ListItem.constructFromObject({ text: "Yellow", value: "yellow" }),
        docusign.ListItem.constructFromObject({ text: "Green", value: "green" }),
        docusign.ListItem.constructFromObject({ text: "Blue", value: "blue" }),
        docusign.ListItem.constructFromObject({ text: "Indigo", value: "indigo" }),
        docusign.ListItem.constructFromObject({ text: "Violet", value: "violet" }),
      ],
    }),
    // The SDK can't create a number tab at this time. Bug DCM-2732
    // Until it is fixed, use a text tab instead.
    //   , number = docusign.Number.constructFromObject({
    //         documentId: "1", pageNumber: "1", xPosition: "163", yPosition: "260",
    //         font: "helvetica", fontSize: "size14", tabLabel: "numbersOnly",
    //         height: "23", width: "84", required: "false"})
    textInsteadOfNumber = docusign.Text.constructFromObject({
      documentId: "1",
      pageNumber: "1",
      xPosition: "163",
      yPosition: "260",
      font: "helvetica",
      fontSize: "size14",
      tabLabel: "numbersOnly",
      height: "23",
      width: "84",
      required: "false",
    }),
    radioGroup = docusign.RadioGroup.constructFromObject({
      documentId: "1",
      groupName: "radio1",
      radios: [
        docusign.Radio.constructFromObject({
          font: "helvetica",
          fontSize: "size14",
          pageNumber: "1",
          value: "white",
          xPosition: "142",
          yPosition: "384",
          required: "false",
        }),
        docusign.Radio.constructFromObject({
          font: "helvetica",
          fontSize: "size14",
          pageNumber: "1",
          value: "red",
          xPosition: "74",
          yPosition: "384",
          required: "false",
        }),
        docusign.Radio.constructFromObject({
          font: "helvetica",
          fontSize: "size14",
          pageNumber: "1",
          value: "blue",
          xPosition: "220",
          yPosition: "384",
          required: "false",
        }),
      ],
    }),
    text = docusign.Text.constructFromObject({
      documentId: "1",
      pageNumber: "1",
      xPosition: "153",
      yPosition: "230",
      font: "helvetica",
      fontSize: "size14",
      tabLabel: "text",
      height: "23",
      width: "84",
      required: "false",
    });
  // Tabs are set per recipient / signer
  let signer1Tabs = docusign.Tabs.constructFromObject({
    checkboxTabs: [check1, check2, check3, check4],
    listTabs: [list1],
    // numberTabs: [number],
    radioGroupTabs: [radioGroup],
    signHereTabs: [signHere],
    textTabs: [text, textInsteadOfNumber],
  });
  signer1.tabs = signer1Tabs;
  // Add the recipients to the env object
  let recipients = docusign.Recipients.constructFromObject({
    signers: [signer1],
    carbonCopies: [cc1],
  });
  // create the envelope template definition object
  let envelopeTemplateDefinition = new docusign.EnvelopeTemplate.constructFromObject({
    description: "Example template created via the API",
    name: templateName,
    shared: "false",
  });
  // create the overall template definition
  let template = new docusign.EnvelopeTemplate.constructFromObject({
    // The order in the docs array determines the order in the env
    documents: [doc],
    emailSubject: "Please sign this document",
    envelopeTemplateDefinition: envelopeTemplateDefinition,
    recipients: recipients,
    status: "created",
  });
  return template;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMDguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQzFCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sRUFDOUMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMzQixNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ25CLEVBQUUsR0FBRyxPQUFPLEVBQUUsMEJBQTBCO0FBQ3hDLGdCQUFnQixHQUFHLHNCQUFzQixFQUN6QyxnQkFBZ0IsR0FBRyxDQUFDLEVBQ3BCLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxFQUM5RCxPQUFPLEdBQUcsdUJBQXVCLEVBQ2pDLFlBQVksR0FBRyxnQ0FBZ0MsQ0FBQztBQUNsRDs7R0FFRztBQUNILEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDakMscUVBQXFFO0lBQ3JFLGtFQUFrRTtJQUNsRSxpRUFBaUU7SUFDakUsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUMvQyxJQUFJLE9BQU8sRUFBRTtRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUU7WUFDakMsS0FBSyxFQUFFLG1CQUFtQjtZQUMxQixNQUFNLEVBQUUsUUFBUSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO1lBQzdELGFBQWEsRUFBRSxRQUFRLENBQUMsYUFBYSxHQUFHLEVBQUU7WUFDMUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxhQUFhO1NBQ2hDLENBQUMsQ0FBQztLQUNKO1NBQU07UUFDTCx3RUFBd0U7UUFDeEUsR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ25DLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUNoQztBQUNILENBQUMsQ0FBQztBQUVGOzs7O0dBSUc7QUFDSCxLQUFLLENBQUMsZ0JBQWdCLEdBQUcsQ0FBTyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDMUMsMEJBQTBCO0lBQzFCLG9EQUFvRDtJQUNwRCx1REFBdUQ7SUFDdkQsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUMvRCxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUscUNBQXFDLENBQUMsQ0FBQztRQUN6RCwyREFBMkQ7UUFDM0QsMENBQTBDO1FBQzFDLDBEQUEwRDtRQUMxRCxtREFBbUQ7UUFDbkQsa0JBQWtCO1FBQ2xCLEdBQUcsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNuQyxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDaEM7SUFFRCxpQ0FBaUM7SUFDakMsSUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsRUFDaEQsV0FBVyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEVBQzVDLElBQUksR0FBRztRQUNMLFdBQVcsRUFBRSxXQUFXO1FBQ3hCLFdBQVcsRUFBRSxHQUFHLENBQUMsZUFBZSxDQUFDLFdBQVc7UUFDNUMsU0FBUyxFQUFFLFNBQVM7UUFDcEIsWUFBWSxFQUFFLFlBQVk7S0FDM0IsRUFDRCxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBQ2pCLElBQUk7UUFDRixPQUFPLEdBQUcsTUFBTSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3BDO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxJQUFJLFNBQVMsR0FBRyxLQUFLLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUk7UUFDNUQseUVBQXlFO1FBQ3pFLFNBQVMsR0FBRyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsRUFDNUMsWUFBWSxHQUFHLFNBQVMsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDO1FBQ2hELG1FQUFtRTtRQUNuRSxrQ0FBa0M7UUFDbEMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7S0FDN0Y7SUFDRCxJQUFJLE9BQU8sRUFBRTtRQUNYLDRFQUE0RTtRQUM1RSxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBQzVDLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDLDhDQUE4QyxDQUFDO1FBRXpILEdBQUcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLEVBQUU7WUFDL0IsS0FBSyxFQUFFLGtCQUFrQjtZQUN6QixFQUFFLEVBQUUsa0JBQWtCO1lBQ3RCLE9BQU8sRUFBRSxHQUFHLEdBQUcsdUJBQXVCLE9BQU8sQ0FBQyxZQUFZLFFBQVEsT0FBTyxDQUFDLFVBQVUsR0FBRztTQUN4RixDQUFDLENBQUM7S0FDSjtBQUNILENBQUMsQ0FBQSxDQUFDO0FBRUY7Ozs7Ozs7R0FPRztBQUNILDJDQUEyQztBQUMzQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQU0sSUFBSSxFQUFDLEVBQUU7SUFDMUIsSUFBSSxZQUFZLEdBQUcsSUFBSSxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFDNUQsZUFBZSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLGdCQUFnQixDQUFDLEVBQ2xFLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsRUFDL0QsT0FBTyxHQUFHLElBQUksRUFDZCxVQUFVLEdBQUcsSUFBSSxFQUFFLCtDQUErQztJQUNsRSxtQkFBbUIsR0FBRyxJQUFJLEVBQzFCLGtCQUFrQixHQUFHLElBQUksQ0FBQztJQUM1Qiw2Q0FBNkM7SUFDN0Msb0RBQW9EO0lBQ3BELE9BQU8sR0FBRyxNQUFNLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBRWpGLElBQUksT0FBTyxDQUFDLGFBQWEsR0FBRyxDQUFDLEVBQUU7UUFDN0IsVUFBVSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7UUFDckQsbUJBQW1CLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUN4RCxrQkFBa0IsR0FBRyxLQUFLLENBQUM7S0FDNUI7U0FBTTtRQUNMLGlEQUFpRDtRQUNqRCw2QkFBNkI7UUFDN0IsSUFBSSxpQkFBaUIsR0FBRyxZQUFZLEVBQUUsQ0FBQztRQUN2QyxPQUFPLEdBQUcsTUFBTSxlQUFlLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQztRQUN6RixVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUNoQyxtQkFBbUIsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQ25DLGtCQUFrQixHQUFHLElBQUksQ0FBQztRQUMxQixnRUFBZ0U7S0FDakU7SUFFRCxPQUFPO1FBQ0wsVUFBVSxFQUFFLFVBQVU7UUFDdEIsWUFBWSxFQUFFLG1CQUFtQjtRQUNqQyxrQkFBa0IsRUFBRSxrQkFBa0I7S0FDdkMsQ0FBQztBQUNKLENBQUMsQ0FBQSxDQUFDO0FBRUY7Ozs7OztHQU1HO0FBQ0gsU0FBUyxZQUFZO0lBQ25CLGlDQUFpQztJQUNqQyxFQUFFO0lBQ0Ysd0NBQXdDO0lBQ3hDLHVCQUF1QjtJQUN2QixtQkFBbUI7SUFDbkIsaURBQWlEO0lBQ2pELHVEQUF1RDtJQUV2RCxJQUFJLFdBQVcsQ0FBQztJQUNoQixtQ0FBbUM7SUFDbkMsbUVBQW1FO0lBQ25FLFdBQVcsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFFbkUsb0JBQW9CO0lBQ3BCLElBQUksR0FBRyxHQUFHLElBQUksUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUMvQixNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkQsR0FBRyxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUM7SUFDNUIsR0FBRyxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsQ0FBQyx5Q0FBeUM7SUFDbkUsR0FBRyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7SUFDMUIsR0FBRyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7SUFFckIsK0VBQStFO0lBQy9FLHVEQUF1RDtJQUN2RCxJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDO1FBQ2hELFFBQVEsRUFBRSxRQUFRO1FBQ2xCLFdBQVcsRUFBRSxHQUFHO1FBQ2hCLFlBQVksRUFBRSxHQUFHO0tBQ2xCLENBQUMsQ0FBQztJQUNILHdFQUF3RTtJQUN4RSxzRUFBc0U7SUFDdEUsd0RBQXdEO0lBRXhELHlGQUF5RjtJQUN6RiwyQ0FBMkM7SUFDM0MsSUFBSSxHQUFHLEdBQUcsSUFBSSxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDcEMsR0FBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7SUFDcEIsR0FBRyxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUM7SUFDdkIsR0FBRyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUM7SUFFdEIsNENBQTRDO0lBQzVDLElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUM7UUFDbkQsVUFBVSxFQUFFLEdBQUc7UUFDZixVQUFVLEVBQUUsR0FBRztRQUNmLFNBQVMsRUFBRSxLQUFLO1FBQ2hCLFNBQVMsRUFBRSxLQUFLO0tBQ2pCLENBQUMsRUFDQSxNQUFNLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQztRQUM3QyxVQUFVLEVBQUUsR0FBRztRQUNmLFVBQVUsRUFBRSxHQUFHO1FBQ2YsU0FBUyxFQUFFLElBQUk7UUFDZixTQUFTLEVBQUUsS0FBSztRQUNoQixJQUFJLEVBQUUsV0FBVztRQUNqQixRQUFRLEVBQUUsUUFBUTtRQUNsQixRQUFRLEVBQUUsaUJBQWlCO0tBQzVCLENBQUMsRUFDRixNQUFNLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQztRQUM3QyxVQUFVLEVBQUUsR0FBRztRQUNmLFVBQVUsRUFBRSxHQUFHO1FBQ2YsU0FBUyxFQUFFLElBQUk7UUFDZixTQUFTLEVBQUUsS0FBSztRQUNoQixJQUFJLEVBQUUsV0FBVztRQUNqQixRQUFRLEVBQUUsUUFBUTtRQUNsQixRQUFRLEVBQUUsa0JBQWtCO0tBQzdCLENBQUMsRUFDRixNQUFNLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQztRQUM3QyxVQUFVLEVBQUUsR0FBRztRQUNmLFVBQVUsRUFBRSxHQUFHO1FBQ2YsU0FBUyxFQUFFLElBQUk7UUFDZixTQUFTLEVBQUUsS0FBSztRQUNoQixJQUFJLEVBQUUsV0FBVztRQUNqQixRQUFRLEVBQUUsUUFBUTtRQUNsQixRQUFRLEVBQUUsYUFBYTtLQUN4QixDQUFDLEVBQ0YsTUFBTSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUM7UUFDN0MsVUFBVSxFQUFFLEdBQUc7UUFDZixVQUFVLEVBQUUsR0FBRztRQUNmLFNBQVMsRUFBRSxJQUFJO1FBQ2YsU0FBUyxFQUFFLEtBQUs7UUFDaEIsSUFBSSxFQUFFLFdBQVc7UUFDakIsUUFBUSxFQUFFLFFBQVE7UUFDbEIsUUFBUSxFQUFFLG1CQUFtQjtLQUM5QixDQUFDLEVBQ0YsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDeEMsVUFBVSxFQUFFLEdBQUc7UUFDZixVQUFVLEVBQUUsR0FBRztRQUNmLFNBQVMsRUFBRSxLQUFLO1FBQ2hCLFNBQVMsRUFBRSxLQUFLO1FBQ2hCLElBQUksRUFBRSxXQUFXO1FBQ2pCLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLFFBQVEsRUFBRSxNQUFNO1FBQ2hCLFFBQVEsRUFBRSxPQUFPO1FBQ2pCLFNBQVMsRUFBRTtZQUNULFFBQVEsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQztZQUNwRSxRQUFRLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUM7WUFDMUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDO1lBQzFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUN4RSxRQUFRLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDdEUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDO1lBQzFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQztTQUMzRTtLQUNGLENBQUM7SUFDRiwrREFBK0Q7SUFDL0QsNkNBQTZDO0lBQzdDLHFEQUFxRDtJQUNyRCxnRkFBZ0Y7SUFDaEYsMEVBQTBFO0lBQzFFLHlEQUF5RDtJQUN6RCxtQkFBbUIsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBQ3RELFVBQVUsRUFBRSxHQUFHO1FBQ2YsVUFBVSxFQUFFLEdBQUc7UUFDZixTQUFTLEVBQUUsS0FBSztRQUNoQixTQUFTLEVBQUUsS0FBSztRQUNoQixJQUFJLEVBQUUsV0FBVztRQUNqQixRQUFRLEVBQUUsUUFBUTtRQUNsQixRQUFRLEVBQUUsYUFBYTtRQUN2QixNQUFNLEVBQUUsSUFBSTtRQUNaLEtBQUssRUFBRSxJQUFJO1FBQ1gsUUFBUSxFQUFFLE9BQU87S0FDbEIsQ0FBQyxFQUNGLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLG1CQUFtQixDQUFDO1FBQ25ELFVBQVUsRUFBRSxHQUFHO1FBQ2YsU0FBUyxFQUFFLFFBQVE7UUFDbkIsTUFBTSxFQUFFO1lBQ04sUUFBUSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQztnQkFDakMsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLFFBQVEsRUFBRSxRQUFRO2dCQUNsQixVQUFVLEVBQUUsR0FBRztnQkFDZixLQUFLLEVBQUUsT0FBTztnQkFDZCxTQUFTLEVBQUUsS0FBSztnQkFDaEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFFBQVEsRUFBRSxPQUFPO2FBQ2xCLENBQUM7WUFDRixRQUFRLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDO2dCQUNqQyxJQUFJLEVBQUUsV0FBVztnQkFDakIsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFVBQVUsRUFBRSxHQUFHO2dCQUNmLEtBQUssRUFBRSxLQUFLO2dCQUNaLFNBQVMsRUFBRSxJQUFJO2dCQUNmLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixRQUFRLEVBQUUsT0FBTzthQUNsQixDQUFDO1lBQ0YsUUFBUSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQztnQkFDakMsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLFFBQVEsRUFBRSxRQUFRO2dCQUNsQixVQUFVLEVBQUUsR0FBRztnQkFDZixLQUFLLEVBQUUsTUFBTTtnQkFDYixTQUFTLEVBQUUsS0FBSztnQkFDaEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFFBQVEsRUFBRSxPQUFPO2FBQ2xCLENBQUM7U0FDSDtLQUNGLENBQUMsRUFDRixJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztRQUN2QyxVQUFVLEVBQUUsR0FBRztRQUNmLFVBQVUsRUFBRSxHQUFHO1FBQ2YsU0FBUyxFQUFFLEtBQUs7UUFDaEIsU0FBUyxFQUFFLEtBQUs7UUFDaEIsSUFBSSxFQUFFLFdBQVc7UUFDakIsUUFBUSxFQUFFLFFBQVE7UUFDbEIsUUFBUSxFQUFFLE1BQU07UUFDaEIsTUFBTSxFQUFFLElBQUk7UUFDWixLQUFLLEVBQUUsSUFBSTtRQUNYLFFBQVEsRUFBRSxPQUFPO0tBQ2xCLENBQUMsQ0FBQztJQUNMLHNDQUFzQztJQUN0QyxJQUFJLFdBQVcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBQ2xELFlBQVksRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQztRQUM5QyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUM7UUFDakIsd0JBQXdCO1FBQ3hCLGNBQWMsRUFBRSxDQUFDLFVBQVUsQ0FBQztRQUM1QixZQUFZLEVBQUUsQ0FBQyxRQUFRLENBQUM7UUFDeEIsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLG1CQUFtQixDQUFDO0tBQ3RDLENBQUMsQ0FBQztJQUNILE9BQU8sQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDO0lBRTNCLHVDQUF1QztJQUN2QyxJQUFJLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLG1CQUFtQixDQUFDO1FBQ3ZELE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUNsQixZQUFZLEVBQUUsQ0FBQyxHQUFHLENBQUM7S0FDcEIsQ0FBQyxDQUFDO0lBRUgsaURBQWlEO0lBQ2pELElBQUksMEJBQTBCLEdBQUcsSUFBSSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUM7UUFDakYsV0FBVyxFQUFFLHNDQUFzQztRQUNuRCxJQUFJLEVBQUUsWUFBWTtRQUNsQixNQUFNLEVBQUUsT0FBTztLQUNoQixDQUFDLENBQUM7SUFFSCx5Q0FBeUM7SUFDekMsSUFBSSxRQUFRLEdBQUcsSUFBSSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUM7UUFDL0QsOERBQThEO1FBQzlELFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztRQUNoQixZQUFZLEVBQUUsMkJBQTJCO1FBQ3pDLDBCQUEwQixFQUFFLDBCQUEwQjtRQUN0RCxVQUFVLEVBQUUsVUFBVTtRQUN0QixNQUFNLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUM7SUFFSCxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDIn0=
