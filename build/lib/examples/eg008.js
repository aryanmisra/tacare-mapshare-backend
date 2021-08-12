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
  docFile = "World_Wide_Corp_fields.pdf",
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
      csrfToken: req.csrfToken(),
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
  let envelopeTemplateDefinition = new docusign.EnvelopeTemplateDefinition.constructFromObject({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMDguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQ3RCLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sRUFDOUMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FDekI7QUFFTCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ2YsRUFBRSxHQUFHLE9BQU8sQ0FBQywwQkFBMEI7RUFDdkMsZ0JBQWdCLEdBQUcsc0JBQXNCLEVBQ3pDLGdCQUFnQixHQUFHLENBQUMsRUFDcEIsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLHNCQUFzQixDQUFDLEVBQzlELE9BQU8sR0FBRyw0QkFBNEIsRUFDdEMsWUFBWSxHQUFHLGdDQUFnQyxDQUNoRDtBQUVMOztHQUVHO0FBQ0gsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtJQUMvQixxRUFBcUU7SUFDckUsa0VBQWtFO0lBQ2xFLGlFQUFpRTtJQUNqRSxJQUFJLE9BQU8sR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQy9DLElBQUksT0FBTyxFQUFFO1FBQ1QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRTtZQUMvQixTQUFTLEVBQUUsR0FBRyxDQUFDLFNBQVMsRUFBRTtZQUMxQixLQUFLLEVBQUUsbUJBQW1CO1lBQzFCLE1BQU0sRUFBRSxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7WUFDN0QsYUFBYSxFQUFFLFFBQVEsQ0FBQyxhQUFhLEdB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
