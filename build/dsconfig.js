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
    signerEmail: process.env.DS_SIGNER_EMAIL || "{USER_EMAIL}",
    signerName: process.env.DS_SIGNER_NAME || "{USER_NAME}",
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
exports.config.dsOauthServer = exports.config.production ? "https://account.docusign.com" : "https://account-d.docusign.com";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHNjb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9kc2NvbmZpZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFFbkMsT0FBTyxDQUFDLE1BQU0sR0FBRztJQUNmLFVBQVUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxNQUFNLENBQUMsVUFBVTtJQUN6RCxjQUFjLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxNQUFNLENBQUMsY0FBYztJQUNyRSxXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksY0FBYztJQUMxRCxVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksYUFBYTtJQUN2RCxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksdUJBQXVCO0lBQ3pELG1GQUFtRjtJQUNuRixtREFBbUQ7SUFDbkQsVUFBVSxFQUFFLEtBQUs7SUFDakIsS0FBSyxFQUFFLElBQUk7SUFDWCxhQUFhLEVBQUUsT0FBTztJQUN0Qix5QkFBeUIsRUFBRSxJQUFJO0lBQy9CLDBEQUEwRDtJQUUxRCxlQUFlLEVBQUUsSUFBSTtJQUNyQixXQUFXLEVBQUUsZ0JBQWdCO0lBQzdCLE9BQU8sRUFBRSx3QkFBd0I7SUFDakMsTUFBTSxFQUFFLHVCQUF1QjtJQUMvQiwwQ0FBMEM7SUFDMUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsSUFBSSx5QkFBeUI7SUFDaEYsV0FBVyxFQUFFLFFBQVE7SUFDckIsa0JBQWtCLEVBQUUsUUFBUTtJQUM1QixnQkFBZ0IsRUFBRSxrRkFBa0Y7SUFDcEcsYUFBYSxFQUFFLElBQUk7SUFDbkIsa0ZBQWtGO0NBQ25GLENBQUM7QUFFRixPQUFPLENBQUMsTUFBTSxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLGdDQUFnQyxDQUFDIn0=