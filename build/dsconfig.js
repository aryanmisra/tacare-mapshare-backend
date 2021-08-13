"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const config = __importStar(require("./config"));
exports.config = {
    dsClientId: process.env.DS_CLIENT_ID || config.dsClientId,
    dsClientSecret: process.env.DS_CLIENT_SECRET || config.dsClientSecret,
    signerEmail: process.env.DS_SIGNER_EMAIL || "aryanmisra4@gmail.com",
    signerName: process.env.DS_SIGNER_NAME || "aryan misra",
    appUrl: process.env.DS_APP_URL || "http://localhost:5000",
    // NOTE: You must add a Redirect URI of appUrl/ds/callback to your Integration Key.
    //       Example: http://localhost:5000/ds/callback
    production: false,
    debug: true,
    sessionSecret: "12345",
    allowSilentAuthentication: true,
    // active login session on another tab of the same browser
    targetAccountId: null,
    demoDocPath: "demo_documents",
    docDocx: "mapshare_template.docx",
    docPdf: "mapshare_template.pdf",
    // Payment gateway information is optional
    gatewayAccountId: process.env.DS_PAYMENT_GATEWAY_ID || "{DS_PAYMENT_GATEWAY_ID}",
    gatewayName: "stripe",
    gatewayDisplayName: "Stripe",
    githubExampleUrl: "https://github.com/docusign/eg-03-node-auth-code-grant/tree/master/lib/examples/",
    documentation: null,
    //, documentation: 'https://developers.docusign.com/esign-rest-api/code-examples/'
};
exports.config.dsOauthServer = exports.config.production ? "https://account.docusign.com" : "https://account.docusign.com";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHNjb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9kc2NvbmZpZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFFbkMsT0FBTyxDQUFDLE1BQU0sR0FBRztJQUNmLFVBQVUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxNQUFNLENBQUMsVUFBVTtJQUN6RCxjQUFjLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxNQUFNLENBQUMsY0FBYztJQUNyRSxXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksdUJBQXVCO0lBQ25FLFVBQVUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxhQUFhO0lBQ3ZELE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSx1QkFBdUI7SUFDekQsbUZBQW1GO0lBQ25GLG1EQUFtRDtJQUNuRCxVQUFVLEVBQUUsS0FBSztJQUNqQixLQUFLLEVBQUUsSUFBSTtJQUNYLGFBQWEsRUFBRSxPQUFPO0lBQ3RCLHlCQUF5QixFQUFFLElBQUk7SUFDL0IsMERBQTBEO0lBRTFELGVBQWUsRUFBRSxJQUFJO0lBQ3JCLFdBQVcsRUFBRSxnQkFBZ0I7SUFDN0IsT0FBTyxFQUFFLHdCQUF3QjtJQUNqQyxNQUFNLEVBQUUsdUJBQXVCO0lBQy9CLDBDQUEwQztJQUMxQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixJQUFJLHlCQUF5QjtJQUNoRixXQUFXLEVBQUUsUUFBUTtJQUNyQixrQkFBa0IsRUFBRSxRQUFRO0lBQzVCLGdCQUFnQixFQUFFLGtGQUFrRjtJQUNwRyxhQUFhLEVBQUUsSUFBSTtJQUNuQixrRkFBa0Y7Q0FDbkYsQ0FBQztBQUVGLE9BQU8sQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsOEJBQThCLENBQUMifQ==