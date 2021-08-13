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
    production: false,
    debug: true,
    sessionSecret: "12345",
    allowSilentAuthentication: true,
    targetAccountId: null,
    demoDocPath: "demo_documents",
    docDocx: "mapshare_template.docx",
    docPdf: "mapshare_template.pdf",
    gatewayAccountId: "{DS_PAYMENT_GATEWAY_ID}",
    gatewayName: "",
    gatewayDisplayName: "",
    githubExampleUrl: "",
    documentation: null,
};
exports.config.dsOauthServer = exports.config.production ? "https://account.docusign.com" : "https://account-d.docusign.com";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHNjb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9kc2NvbmZpZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFFbkMsT0FBTyxDQUFDLE1BQU0sR0FBRztJQUNmLFVBQVUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxNQUFNLENBQUMsVUFBVTtJQUN6RCxjQUFjLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxNQUFNLENBQUMsY0FBYztJQUNyRSxXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksY0FBYztJQUMxRCxVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksYUFBYTtJQUN2RCxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksdUJBQXVCO0lBQ3pELFVBQVUsRUFBRSxLQUFLO0lBQ2pCLEtBQUssRUFBRSxJQUFJO0lBQ1gsYUFBYSxFQUFFLE9BQU87SUFDdEIseUJBQXlCLEVBQUUsSUFBSTtJQUMvQixlQUFlLEVBQUUsSUFBSTtJQUNyQixXQUFXLEVBQUUsZ0JBQWdCO0lBQzdCLE9BQU8sRUFBRSx3QkFBd0I7SUFDakMsTUFBTSxFQUFFLHVCQUF1QjtJQUMvQixnQkFBZ0IsRUFBRSx5QkFBeUI7SUFDM0MsV0FBVyxFQUFFLEVBQUU7SUFDZixrQkFBa0IsRUFBRSxFQUFFO0lBQ3RCLGdCQUFnQixFQUFFLEVBQUU7SUFDcEIsYUFBYSxFQUFFLElBQUk7Q0FDcEIsQ0FBQztBQUVGLE9BQU8sQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsZ0NBQWdDLENBQUMifQ==