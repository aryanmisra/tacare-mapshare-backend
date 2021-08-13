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
dsRouter.get("/audit/status/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const branch = yield branch_1.default.findOne({ slug: req.params.id }).exec();
    let tokenOK = req.dsAuthCodeGrant.checkToken();
    if (tokenOK) {
        res.render('pages/updateAuditStatus', {
            title: "Update Audit Status",
            envelopeOk: branch,
            eid: branch === null || branch === void 0 ? void 0 : branch.auditStatus.envelopeId
        });
    }
    else {
        // Save the current operation so it will be resumed after authentication
        req.dsAuthCodeGrant.setEg(req, `audit/status/${req.params.id}`);
        res.redirect("/ds/mustAuthenticate");
    }
}));
dsRouter.post("/audit/status/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const branch = yield branch_1.default.findOne({ slug: req.params.id }).exec();
    let tokenOK = req.dsAuthCodeGrant.checkToken(3);
    if (!tokenOK) {
        req.flash('info', 'Sorry, you need to re-authenticate.');
        req.dsAuthCodeGrant.setEg(req, `audit/status/${req.params.id}`);
        res.redirect("/ds/mustAuthenticate");
    }
    // Step 2. Call the worker method
    let accountId = req.dsAuthCodeGrant.getAccountId(), dsAPIclient = req.dsAuthCodeGrant.getDSApi(), args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        envelopeId: branch === null || branch === void 0 ? void 0 : branch.auditStatus.envelopeId
    }, results;
    try {
        results = yield statusWorker(args);
        console.log(results);
    }
    catch (error) {
        let errorBody = error && error.response && error.response.body, errorCode = errorBody && errorBody.errorCode, errorMessage = errorBody && errorBody.message;
        res.render('pages/error', { err: error, errorCode: errorCode, errorMessage: errorMessage });
    }
    if (results) {
        res.render('pages/example_done', {
            title: "Get envelope status results",
            h1: "Get envelope status results",
            message: `Results from the Envelopes::get method:`,
            json: JSON.stringify(results)
        });
    }
}));
dsRouter.get("/audit/:id/:uid", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.params.id, req.params.uid);
    const branch = yield branch_1.default.findOne({ slug: req.params.id }).exec();
    const admin = yield user_1.default.findOne({ _id: req.params.uid }).exec();
    if (branch && admin) {
        let tokenOK = req.dsAuthCodeGrant.checkToken();
        if (tokenOK) {
            res.render("pages/virtualAudit", {
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
const statusWorker = (args) => __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign_esign_1.default.EnvelopesApi(args.dsAPIclient), getEnvelopeP = args.makePromise(envelopesApi, 'listRecipients'), results;
    ;
    results = yield getEnvelopeP(args.accountId, args.envelopeId, null);
    return results;
});
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
    pdfBytes = fs.readFileSync(path.resolve(path.resolve(__dirname, "../documents"), "mapshare_template.pdf"));
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
        font: "Calibri",
        fontSize: "Size14"
    });
    let branchNoteText = docusign_esign_1.default.Text.constructFromObject({
        value: args.branchNote,
        anchorString: "**branch_notes**",
        font: "Calibri",
        fontSize: "Size14"
    });
    let branchOwnerName = docusign_esign_1.default.Text.constructFromObject({
        value: args.branchOwnerName,
        anchorString: "**branchOwner_name**",
        font: "Calibri",
        fontSize: "Size12"
    });
    let branchOwnerEmail = docusign_esign_1.default.Text.constructFromObject({
        value: args.branchOwnerEmail,
        anchorString: "**branchOwner_email**",
        font: "Calibri",
        fontSize: "Size12"
    });
    let adminName = docusign_esign_1.default.Text.constructFromObject({
        value: args.adminName,
        anchorString: "**admin_name**",
        font: "Calibri",
        fontSize: "Size12"
    });
    let adminEmail = docusign_esign_1.default.Text.constructFromObject({
        value: args.adminEmail,
        anchorString: "**admin_email**",
        font: "Calibri",
        fontSize: "Size12"
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
      <img src="${args.imageBase64}" alt="TACARE MAPSHARE VIRTUAL AUDIT IMAGE" width="400px"/>
      </body>
  </html>
`;
}
exports.default = dsRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9jb250cm9sbGVycy9kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLDBEQUFrQztBQUNsQyw4REFBc0M7QUFDdEMsOERBQXNDO0FBQ3RDLG9FQUFzQztBQUN0QyxvREFBdUQ7QUFDdkQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ2xELE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMvQixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzdDLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFFOUQsU0FBUyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJO0lBQ2hDLEdBQUcsQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUNELFNBQVMsVUFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSTtJQUNoQyxHQUFHLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3RELENBQUM7QUFFRCxRQUFRO0tBQ0wsR0FBRyxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxlQUFlLENBQUM7S0FDM0MsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDbkMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM1QyxD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