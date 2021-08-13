import User from "../models/user";
import Branch from "../models/branch";
import Commit from "../models/commit";
import docusign from "docusign-esign";
import {tokenAuthenticator} from "../utils/middleware";
const dsConfig = require("../dsconfig.js").config;
const fs = require("fs-extra");
const path = require("path");
const dsRouter = require("express").Router();
const commonControllers = require("../lib/commonControllers");

function dsLoginCB1(req, res, next) {
  req.dsAuthCodeGrant.oauth_callback1(req, res, next);
}
function dsLoginCB2(req, res, next) {
  req.dsAuthCodeGrant.oauth_callback2(req, res, next);
}

dsRouter
  .get("/", commonControllers.indexController)
  .get("/ds/login", (req, res, next) => {
    req.dsAuthCodeGrant.login(req, res, next);
  })
  .get("/ds/callback", [dsLoginCB1, dsLoginCB2]) // OAuth callbacks. See below
  .get("/ds/logout", (req, res) => {
    req.dsAuthCodeGrant.logout(req, res);
  })
  .get("/ds/logoutCallback", (req, res) => {
    req.dsAuthCodeGrant.logoutCallback(req, res);
  })
  .get("/ds/mustAuthenticate", commonControllers.mustAuthenticateController)
  .get("/ds-return", commonControllers.returnController);

dsRouter.post("/audit/image/:id", tokenAuthenticator, async (req, res, next) => {
  const {imageBase64} = req.body;
  const branch = await Branch.findOne({slug: req.params.id})
  const admin = await User.findById(req.uid).exec();
  if (branch && admin) {
    if (admin.userType !== "admin") {
      res.sendStatus(403)
    } else {
      branch.imageBase64 = imageBase64;
      await branch.save()
      res.sendStatus(200)
    }
  } else {
    res.sendStatus(400)
  }
})

dsRouter.get("/audit/status/:id", async (req, res, next) => {
  const branch = await Branch.findOne({slug: req.params.id}).exec()
  let tokenOK = req.dsAuthCodeGrant.checkToken();
  if (tokenOK) {
    res.render('pages/updateAuditStatus', {
      title: "Update Audit Status",
      envelopeOk: branch,
      eid: branch?.auditStatus.envelopeId
    });
  } else {
    // Save the current operation so it will be resumed after authentication
    req.dsAuthCodeGrant.setEg(req, `audit/status/${req.params.id}`);
    res.redirect("/ds/mustAuthenticate");
  }
})

dsRouter.post("/audit/status/:id", async (req, res, next) => {
  const branch = await Branch.findOne({slug: req.params.id}).exec()
  let tokenOK = req.dsAuthCodeGrant.checkToken(3);
  if (!tokenOK) {
    req.flash('info', 'Sorry, you need to re-authenticate.');
    req.dsAuthCodeGrant.setEg(req, `audit/status/${req.params.id}`);
    res.redirect("/ds/mustAuthenticate");
  }

  // Step 2. Call the worker method
  let accountId = req.dsAuthCodeGrant.getAccountId()
    , dsAPIclient = req.dsAuthCodeGrant.getDSApi()
    , args = {
      dsAPIclient: dsAPIclient,
      makePromise: req.dsAuthCodeGrant.makePromise, // this is a function
      accountId: accountId,
      envelopeId: branch?.auditStatus.envelopeId
    }, results;

  try {
    results = await statusWorker(args)
    console.log(results)
  }
  catch (error) {
    let errorBody = error && error.response && error.response.body
      , errorCode = errorBody && errorBody.errorCode
      , errorMessage = errorBody && errorBody.message;

    res.render('pages/error', {err: error, errorCode: errorCode, errorMessage: errorMessage});
  }
  if (results) {
    res.render('pages/example_done', {
      title: "Get envelope status results",
      h1: "Get envelope status results",
      message: `Results from the Envelopes::get method:`,
      json: JSON.stringify(results)
    });
  }
})

dsRouter.get("/audit/:id/:uid", async (req, res, next) => {
  console.log(req.params.id, req.params.uid);

  const branch = await Branch.findOne({slug: req.params.id}).exec();
  const admin = await User.findOne({_id: req.params.uid}).exec();
  if (branch && admin) {
    let tokenOK = req.dsAuthCodeGrant.checkToken();
    if (tokenOK) {
      res.render("pages/virtualAudit", {
        title: "Start Virtual Audit",
      });
    } else {
      req.dsAuthCodeGrant.setEg(req, `audit/${req.params.id}/${req.params.uid}`);
      res.redirect("/ds/mustAuthenticate");
    }
  } else {
    res.status(400).send("Invalid Request");
  }
});

dsRouter.post("/audit/:id/:uid", async (req, res, next) => {
  console.log(req.params.id);
  let tokenOK = req.dsAuthCodeGrant.checkToken(3);
  if (!tokenOK) {
    req.flash("info", "Sorry, you need to re-authenticate.");
    req.dsAuthCodeGrant.setEg(req, `audit/${req.params.id}/${req.params.uid}`);
    res.redirect("/ds/mustAuthenticate");
  }
  const stakeholders = await User.find({userType: "user"}).exec();
  const branch = await Branch.findOne({slug: req.params.id}).exec();
  const admin = await User.findById(req.params.uid).exec();
  const lastCommit = await Commit.findOne({branchSlug: req.params.id}).sort({order: -1}).exec();

  let envelopeArgs = {
    stakeholders: stakeholders,
    status: "sent",
    branchId: branch?.slug,
    branchNote: branch?.note,
    modificationNote: lastCommit?.note,
    branchOwnerName: branch?.owner.firstName + " " + branch?.owner.lastName,
    branchOwnerEmail: branch?.owner.email,
    adminName: admin?.firstName + " " + admin?.lastName,
    adminEmail: admin?.email,
    imageBase64: branch?.imageBase64
  },
    accountId = req.dsAuthCodeGrant.getAccountId(),
    dsAPIclient = req.dsAuthCodeGrant.getDSApi(),
    args = {
      dsAPIclient: dsAPIclient,
      makePromise: req.dsAuthCodeGrant.makePromise, // this is a function
      accountId: accountId,
      envelopeArgs: envelopeArgs,
    },
    results;
  try {
    results = await worker(args);
  } catch (error) {
    let errorBody = error && error.response && error.response.body,
      errorCode = errorBody && errorBody.errorCode,
      errorMessage = errorBody && errorBody.message;

    res.render("pages/error", {err: error, errorCode: errorCode, errorMessage: errorMessage});
  }
  if (results) {
    console.log(results);
    req.session.envelopeId = results.envelopeId; // Save for use by other examples
    if (branch) {
      branch.auditStatus.envelopeId = results.envelopeId;
      await branch.save();
    }
    res.render("pages/example_done", {
      title: "Audit Started",
      h1: "Virtual Audit Started",
      message: `The envelope has been shared to all stakeholders!<br/>Envelope ID ${results.envelopeId}.`,
    });
  }
});
const statusWorker = async (args) => {
  let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient)
    , getEnvelopeP = args.makePromise(envelopesApi, 'listRecipients')
    , results;
  ;
  results = await getEnvelopeP(args.accountId, args.envelopeId, null);
  return results;
}
const worker = async args => {
  let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient),
    createEnvelopeP = args.makePromise(envelopesApi, "createEnvelope"),
    results;
  // Step 1. Make the envelope request body
  let envelope = makeEnvelope(args.envelopeArgs);

  // Step 2. call Envelopes::create API method
  // Exceptions will be caught by the calling function
  results = await createEnvelopeP(args.accountId, {envelopeDefinition: envelope});
  let envelopeId = results.envelopeId;

  console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
  return {envelopeId: envelopeId};
};

function makeEnvelope(args) {
  let pdfBytes;

  pdfBytes = fs.readFileSync(path.resolve(path.resolve(__dirname, "../documents"), "mapshare_template.pdf"));

  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = "MapShare Virtual Audit: Review Required";
  let imageDoc = new docusign.Document()
  let imageDocb64 = Buffer.from(imageDocGen(args)).toString('base64')
  let pdfDoc = new docusign.Document(),
    pdfDocb64 = Buffer.from(pdfBytes).toString("base64");
  pdfDoc.documentBase64 = pdfDocb64;
  pdfDoc.name = "Virtual Audit Request"; // can be different from actual file name
  pdfDoc.fileExtension = "pdf";
  pdfDoc.documentId = "1";
  imageDoc.documentBase64 = imageDocb64;
  imageDoc.name = "Virtual Audit Image"
  imageDoc.fileExtension = "html"
  imageDoc.documentId = "2"

  env.documents = [pdfDoc, imageDoc];

  const signers: any[] = [];
  let i = 1;
  args.stakeholders.forEach(stakeholder => {
    signers.push(
      docusign.Signer.constructFromObject({
        email: stakeholder.email,
        name: stakeholder.firstName + " " + stakeholder.lastName,
        recipientId: i.toString(),
        routingOrder: "1",
      })
    );
    i += 1;
  });

  let signField = docusign.SignHere.constructFromObject({
    anchorString: "**signature_1**",
    anchorYOffset: "10",
    anchorUnits: "pixels",
    anchorXOffset: "20",
  });
  // Tabs are set per recipient / signer

  let branchIdText = docusign.Text.constructFromObject({
    value: args.branchId,
    anchorString: "**branch_id**",
    font: "Calibri",
    fontSize: "Size14"
  });
  let branchNoteText = docusign.Text.constructFromObject({
    value: args.branchNote,
    anchorString: "**branch_notes**",
    font: "Calibri",
    fontSize: "Size14"
  });
  let modificationNoteText = docusign.Text.constructFromObject({
    value: args.modificationNote,
    anchorString: "**modification_notes**",
    font: "Calibri",
    fontSize: "Size14"
  });
  let branchOwnerName = docusign.Text.constructFromObject({
    value: args.branchOwnerName,
    anchorString: "**branchOwner_name**",
    font: "Calibri",
    fontSize: "Size12"
  });
  let branchOwnerEmail = docusign.Text.constructFromObject({
    value: args.branchOwnerEmail,
    anchorString: "**branchOwner_email**",
    font: "Calibri",
    fontSize: "Size12"
  });
  let adminName = docusign.Text.constructFromObject({
    value: args.adminName,
    anchorString: "**admin_name**",
    font: "Calibri",
    fontSize: "Size12"
  });
  let adminEmail = docusign.Text.constructFromObject({
    value: args.adminEmail,
    anchorString: "**admin_email**",
    font: "Calibri",
    fontSize: "Size12"
  });
  let documentTabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signField],
    textTabs: [branchIdText, branchNoteText, modificationNoteText, branchOwnerName, branchOwnerEmail, adminName, adminEmail],
  });
  signers.forEach(signer => {
    signer.tabs = documentTabs;
  });
  // Add the recipients to the envelope object
  let recipients = docusign.Recipients.constructFromObject({
    signers: signers,
  });
  env.recipients = recipients;

  // Request that the envelope be sent by setting |status| to "sent".
  // To request that the envelope be created as a draft, set to "created"
  env.status = args.status;

  return env;
}

function imageDocGen(args) {
  return `
  <!DOCTYPE html>
  <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
      <img src="${args.imageBase64}" alt="TACARE MAPSHARE VIRTUAL AUDIT IMAGE" width="400px"/>
      </body>
  </html>
`
}

export default dsRouter;
