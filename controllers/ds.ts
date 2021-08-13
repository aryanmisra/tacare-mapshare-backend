import User from "../models/user";
import Branch from "../models/branch";
import Commit from "../models/commit";
import docusign from "docusign-esign";
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

dsRouter.get("/audit/:id/:uid", async (req, res, next) => {
  console.log(req.params.id, req.params.uid);

  const branch = await Branch.findOne({ slug: req.params.id }).exec();
  const admin = await User.findOne({ _id: req.params.uid }).exec();
  if (branch && admin) {
    let tokenOK = req.dsAuthCodeGrant.checkToken();
    if (tokenOK) {
      res.render("pages/examples/eg002", {
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
  const stakeholders = await User.find({ userType: "user" }).exec();
  const branch = await Branch.findOne({ slug: req.params.id }).exec();
  const admin = await User.findById(req.params.uid).exec();
  const lastCommit = await Commit.findOne({ branchSlug: req.params.id }).sort({ order: -1 }).exec();

  let body = req.body;
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

    res.render("pages/error", { err: error, errorCode: errorCode, errorMessage: errorMessage });
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

const worker = async args => {
  let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient),
    createEnvelopeP = args.makePromise(envelopesApi, "createEnvelope"),
    results;
  // Step 1. Make the envelope request body
  let envelope = makeEnvelope(args.envelopeArgs);

  // Step 2. call Envelopes::create API method
  // Exceptions will be caught by the calling function
  results = await createEnvelopeP(args.accountId, { envelopeDefinition: envelope });
  let envelopeId = results.envelopeId;

  console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
  return { envelopeId: envelopeId };
};

function makeEnvelope(args) {
  let pdfBytes;

  pdfBytes = fs.readFileSync(path.resolve(path.resolve(__dirname, "../demo_documents"), "mapshare_template.pdf"));

  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = "MapShare Virtual Audit: Review Required";

  let doc3 = new docusign.Document(),
    doc3b64 = Buffer.from(pdfBytes).toString("base64");
  doc3.documentBase64 = doc3b64;
  doc3.name = "Virtual Audit Request"; // can be different from actual file name
  doc3.fileExtension = "pdf";
  doc3.documentId = "1";

  env.documents = [doc3];

  const signers: any[] = [];
  let i = 1;
  args.stakeholders.forEach(stakeholder => {
    signers.push(
      docusign.Signer.constructFromObject({
        email: stakeholder.email,
        name: stakeholder.firstName + " " + stakeholder.lastName,
        recipientId: i.toString(),
        routingOrder: i.toString(),
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
    font: "helvetica",
  });
  let branchNoteText = docusign.Text.constructFromObject({
    value: args.branchNote,
    anchorString: "**branch_note**",
    font: "helvetica",
  });
  let modificationNoteText = docusign.Text.constructFromObject({
    value: args.modificationNote,
    anchorString: "**modification_note**",
    font: "helvetica",
  });
  let branchOwnerName = docusign.Text.constructFromObject({
    value: args.branchOwnerName,
    anchorString: "**branchOwner_name**",
    font: "helvetica",
  });
  let branchOwnerEmail = docusign.Text.constructFromObject({
    value: args.branchOwnerEmail,
    anchorString: "**branchOwner_email**",
    font: "helvetica",
  });
  let adminName = docusign.Text.constructFromObject({
    value: args.adminName,
    anchorString: "**admin_name**",
    font: "helvetica",
  });
  let adminEmail = docusign.Text.constructFromObject({
    value: args.adminEmail,
    anchorString: "**admin_email**",
    font: "helvetica",
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
export default dsRouter;
