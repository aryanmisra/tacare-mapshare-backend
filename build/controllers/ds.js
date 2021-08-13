"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../models/user"));
const branch_1 = __importDefault(require("../models/branch"));
const commit_1 = __importDefault(require("../models/commit"));
const docusign_esign_1 = __importDefault(require("docusign-esign"));
const middleware_1 = require("../utils/middleware");
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
dsRouter.post("/audit/image/:id", middleware_1.tokenAuthenticator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { imageBase64 } = req.body;
    const branch = yield branch_1.default.findOne({ slug: req.params.id });
    const admin = yield user_1.default.findById(req.uid).exec();
    if (branch && admin) {
        if (admin.userType !== "admin") {
            res.sendStatus(403);
        }
        else {
            branch.imageBase64 = imageBase64;
            yield branch.save();
            res.sendStatus(200);
        }
    }
    else {
        res.sendStatus(400);
    }
}));
dsRouter.get("/audit/:id/:uid", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.params.id, req.params.uid);
    const branch = yield branch_1.default.findOne({ slug: req.params.id }).exec();
    const admin = yield user_1.default.findOne({ _id: req.params.uid }).exec();
    if (branch && admin) {
        let tokenOK = req.dsAuthCodeGrant.checkToken();
        if (tokenOK) {
            res.render("pages/examples/eg002", {
                title: "Start Virtual Audit",
            });
        }
        else {
            req.dsAuthCodeGrant.setEg(req, `audit/${req.params.id}/${req.params.uid}`);
            res.redirect("/ds/mustAuthenticate");
        }
    }
    else {
        res.status(400).send("Invalid Request");
    }
}));
dsRouter.post("/audit/:id/:uid", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        branchOwnerName: (branch === null || branch === void 0 ? void 0 : branch.owner.firstName) + " " + (branch === null || branch === void 0 ? void 0 : branch.owner.lastName),
        branchOwnerEmail: branch === null || branch === void 0 ? void 0 : branch.owner.email,
        adminName: (admin === null || admin === void 0 ? void 0 : admin.firstName) + " " + (admin === null || admin === void 0 ? void 0 : admin.lastName),
        adminEmail: admin === null || admin === void 0 ? void 0 : admin.email,
        imageBase64: branch === null || branch === void 0 ? void 0 : branch.imageBase64
    }, accountId = req.dsAuthCodeGrant.getAccountId(), dsAPIclient = req.dsAuthCodeGrant.getDSApi(), args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        envelopeArgs: envelopeArgs,
    }, results;
    try {
        results = yield worker(args);
    }
    catch (error) {
        let errorBody = error && error.response && error.response.body, errorCode = errorBody && errorBody.errorCode, errorMessage = errorBody && errorBody.message;
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
}));
const worker = (args) => __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign_esign_1.default.EnvelopesApi(args.dsAPIclient), createEnvelopeP = args.makePromise(envelopesApi, "createEnvelope"), results;
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
    let imageDoc = new docusign_esign_1.default.Document();
    let imageDocb64 = Buffer.from(imageDocGen(args)).toString('base64');
    let pdfDoc = new docusign_esign_1.default.Document(), pdfDocb64 = Buffer.from(pdfBytes).toString("base64");
    pdfDoc.documentBase64 = pdfDocb64;
    pdfDoc.name = "Virtual Audit Request"; // can be different from actual file name
    pdfDoc.fileExtension = "pdf";
    pdfDoc.documentId = "1";
    imageDoc.documentBase64 = imageDocb64;
    imageDoc.name = "Virtual Audit Image";
    imageDoc.fileExtension = "html";
    imageDoc.documentId = "2";
    env.documents = [pdfDoc, imageDoc];
    const signers = [];
    let i = 1;
    args.stakeholders.forEach(stakeholder => {
        signers.push(docusign_esign_1.default.Signer.constructFromObject({
            email: stakeholder.email,
            name: stakeholder.firstName + " " + stakeholder.lastName,
            recipientId: i.toString(),
            routingOrder: "1",
        }));
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
function imageDocGen(args) {
    return `
  <!DOCTYPE html>
  <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
      <img src="${args.imageBase64}" alt="TACARE MAPSHARE VIRTUAL AUDIT IMAGE" />
      </body>
  </html>
`;
}
exports.default = dsRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9jb250cm9sbGVycy9kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLDBEQUFrQztBQUNsQyw4REFBc0M7QUFDdEMsOERBQXNDO0FBQ3RDLG9FQUFzQztBQUN0QyxvREFBdUQ7QUFDdkQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ2xELE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMvQixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzdDLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFFOUQsU0FBUyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJO0lBQ2hDLEdBQUcsQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUNELFNBQVMsVUFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSTtJQUNoQyxHQUFHLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3RELENBQUM7QUFFRCxRQUFRO0tBQ0wsR0FBRyxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxlQUFlLENBQUM7S0FDM0MsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDbkMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM1QyxD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