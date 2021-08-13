"use strict";
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
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../models/user"));
const branch_1 = __importDefault(require("../models/branch"));
const commit_1 = __importDefault(require("../models/commit"));
const docusign_esign_1 = __importDefault(require("docusign-esign"));
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
dsRouter.get("/audit/:id/:uid", (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.params.id, req.params.uid);
    const branch = yield branch_1.default.findOne({ slug: req.params.id }).exec();
    const admin = yield user_1.default.findOne({ _id: req.params.uid }).exec();
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
  })
);
dsRouter.post("/audit/:id/:uid", (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.params.id);
    let tokenOK = req.dsAuthCodeGrant.checkToken(3);
    if (!tokenOK) {
      req.flash("info", "Sorry, you need to re-authenticate.");
      req.dsAuthCodeGrant.setEg(req, `audit/${req.params.id}/${req.params.uid}`);
      res.redirect("/ds/mustAuthenticate");
    }
    const stakeholders = yield user_1.default.find({ userType: "user" }).exec();
    const branch = yield branch_1.default.findOne({ slug: req.params.id }).exec();
    const admin = yield user_1.default.findById(req.params.uid).exec();
    const lastCommit = yield commit_1.default.findOne({ branchSlug: req.params.id }).sort({ order: -1 }).exec();
    let body = req.body;
    let envelopeArgs = {
        stakeholders: stakeholders,
        status: "sent",
        branchId: branch === null || branch === void 0 ? void 0 : branch.slug,
        branchNote: branch === null || branch === void 0 ? void 0 : branch.note,
        modificationNote: lastCommit === null || lastCommit === void 0 ? void 0 : lastCommit.note,
        branchOwnerName:
          (branch === null || branch === void 0 ? void 0 : branch.owner.firstName) +
          " " +
          (branch === null || branch === void 0 ? void 0 : branch.owner.lastName),
        branchOwnerEmail: branch === null || branch === void 0 ? void 0 : branch.owner.email,
        adminName:
          (admin === null || admin === void 0 ? void 0 : admin.firstName) +
          " " +
          (admin === null || admin === void 0 ? void 0 : admin.lastName),
        adminEmail: admin === null || admin === void 0 ? void 0 : admin.email,
      },
      accountId = req.dsAuthCodeGrant.getAccountId(),
      dsAPIclient = req.dsAuthCodeGrant.getDSApi(),
      args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        envelopeArgs: envelopeArgs,
      },
      results;
    try {
      results = yield worker(args);
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
        yield branch.save();
      }
      res.render("pages/example_done", {
        title: "Audit Started",
        h1: "Virtual Audit Started",
        message: `The envelope has been shared to all stakeholders!<br/>Envelope ID ${results.envelopeId}.`,
      });
    }
  })
);
const worker = args =>
  __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign_esign_1.default.EnvelopesApi(args.dsAPIclient),
      createEnvelopeP = args.makePromise(envelopesApi, "createEnvelope"),
      results;
    // Step 1. Make the envelope request body
    let envelope = makeEnvelope(args.envelopeArgs);
    // Step 2. call Envelopes::create API method
    // Exceptions will be caught by the calling function
    results = yield createEnvelopeP(args.accountId, { envelopeDefinition: envelope });
    let envelopeId = results.envelopeId;
    console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
    return { envelopeId: envelopeId };
  });
function makeEnvelope(args) {
  let pdfBytes;
  pdfBytes = fs.readFileSync(path.resolve(path.resolve(__dirname, "../demo_documents"), "mapshare_template.pdf"));
  let env = new docusign_esign_1.default.EnvelopeDefinition();
  env.emailSubject = "MapShare Virtual Audit: Review Required";
  let doc3 = new docusign_esign_1.default.Document(),
    doc3b64 = Buffer.from(pdfBytes).toString("base64");
  doc3.documentBase64 = doc3b64;
  doc3.name = "Virtual Audit Request"; // can be different from actual file name
  doc3.fileExtension = "pdf";
  doc3.documentId = "1";
  env.documents = [doc3];
  const signers = [];
  let i = 1;
  args.stakeholders.forEach(stakeholder => {
    signers.push(
      docusign_esign_1.default.Signer.constructFromObject({
        email: stakeholder.email,
        name: stakeholder.firstName + " " + stakeholder.lastName,
        recipientId: i.toString(),
        routingOrder: i.toString(),
      })
    );
    i += 1;
  });
  let signField = docusign_esign_1.default.SignHere.constructFromObject({
    anchorString: "**signature_1**",
    anchorYOffset: "10",
    anchorUnits: "pixels",
    anchorXOffset: "20",
  });
  // Tabs are set per recipient / signer
  let branchIdText = docusign_esign_1.default.Text.constructFromObject({
    value: args.branchId,
    anchorString: "**branch_id**",
    font: "helvetica",
  });
  let branchNoteText = docusign_esign_1.default.Text.constructFromObject({
    value: args.branchNote,
    anchorString: "**branch_note**",
    font: "helvetica",
  });
  let modificationNoteText = docusign_esign_1.default.Text.constructFromObject({
    value: args.modificationNote,
    anchorString: "**modification_note**",
    font: "helvetica",
  });
  let branchOwnerName = docusign_esign_1.default.Text.constructFromObject({
    value: args.branchOwnerName,
    anchorString: "**branchOwner_name**",
    font: "helvetica",
  });
  let branchOwnerEmail = docusign_esign_1.default.Text.constructFromObject({
    value: args.branchOwnerEmail,
    anchorString: "**branchOwner_email**",
    font: "helvetica",
  });
  let adminName = docusign_esign_1.default.Text.constructFromObject({
    value: args.adminName,
    anchorString: "**admin_name**",
    font: "helvetica",
  });
  let adminEmail = docusign_esign_1.default.Text.constructFromObject({
    value: args.adminEmail,
    anchorString: "**admin_email**",
    font: "helvetica",
  });
  let documentTabs = docusign_esign_1.default.Tabs.constructFromObject({
    signHereTabs: [signField],
    textTabs: [branchIdText, branchNoteText, modificationNoteText, branchOwnerName, branchOwnerEmail, adminName, adminEmail],
  });
  signers.forEach(signer => {
    signer.tabs = documentTabs;
  });
  // Add the recipients to the envelope object
  let recipients = docusign_esign_1.default.Recipients.constructFromObject({
    signers: signers,
  });
  env.recipients = recipients;
  // Request that the envelope be sent by setting |status| to "sent".
  // To request that the envelope be created as a draft, set to "created"
  env.status = args.status;
  return env;
}
exports.default = dsRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9jb250cm9sbGVycy9kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLDBEQUFrQztBQUNsQyw4REFBc0M7QUFDdEMsOERBQXNDO0FBQ3RDLG9FQUFzQztBQUN0QyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLENBQUE7QUFDakQsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQzlCLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUM1QixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDN0MsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUU5RCxTQUFTLFVBQVUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUk7SUFDOUIsR0FBRyxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBQ0QsU0FBUyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJO0lBQzlCLEdBQUcsQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELFFBQVE7S0FDSCxHQUFHLENBQUMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLGVBQWUsQ0FBQztLQUMzQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUNqQyxHQUFHLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzlDLENBQUMsQ0FBQztLQUNE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
