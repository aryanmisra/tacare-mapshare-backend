"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, "__esModule", { value: true });
const config = __importStar(require("./config"));
exports.config = {
  dsClientId: process.env.DS_CLIENT_ID || config.dsClientId, // The app's DocuSign integration key
  dsClientSecret: process.env.DS_CLIENT_SECRET || config.dsClientSecret, // The app's DocuSign integration key's secret
  signerEmail: process.env.DS_SIGNER_EMAIL || "aryanmisra4@gmail.com",
  signerName: process.env.DS_SIGNER_NAME || "aryan misra",
  appUrl: process.env.DS_APP_URL || "http://localhost:5000", // The url of the application. Eg http://localhost:5000
  // NOTE: You must add a Redirect URI of appUrl/ds/callback to your Integration Key.
  //       Example: http://localhost:5000/ds/callback
  production: false,
  debug: true, // Send debugging statements to console
  sessionSecret: "12345", // Secret for encrypting session cookie content
  allowSilentAuthentication: true, // a user can be silently authenticated if they have an
  // active login session on another tab of the same browser
  targetAccountId: null, // Set if you want a specific DocuSign AccountId, If null, the user's default account will be used.
  demoDocPath: "demo_documents",
  docDocx: "World_Wide_Corp_Battle_Plan_Trafalgar.docx",
  docPdf: "World_Wide_Corp_lorem.pdf",
  // Payment gateway information is optional
  gatewayAccountId: process.env.DS_PAYMENT_GATEWAY_ID || "{DS_PAYMENT_GATEWAY_ID}",
  gatewayName: "stripe",
  gatewayDisplayName: "Stripe",
  githubExampleUrl: "https://github.com/docusign/eg-03-node-auth-code-grant/tree/master/lib/examples/",
  documentation: null,
  //, documentation: 'https://developers.docusign.com/esign-rest-api/code-examples/'
};
exports.config.dsOauthServer = exports.config.production ? "https://account.docusign.com" : "https://account.docusign.com";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHNjb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9kc2NvbmZpZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBa0M7QUFFbEMsT0FBTyxDQUFDLE1BQU0sR0FBRztJQUNmLFVBQVUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLHFDQUFxQzs7SUFDN0YsY0FBYyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyw4Q0FBOEM7O0lBQ3BILFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSx1QkFBdUI7SUFDbkUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxJQUFJLGFBQWE7SUFDdkQsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLHVCQUF1QixDQUFDLHVEQUF1RDtJQUNuSCxtRkFBbUY7SUFDbkYsbURBQW1EOztJQUNqRCxVQUFVLEVBQUUsS0FBSztJQUNqQixLQUFLLEVBQUUsSUFBSSxDQUFDLHVDQUF1Qzs7SUFDbkQsYUFBYSxFQUFFLE9BQU8sQ0FBQywrQ0FBK0M7O0lBQ3RFLHlCQUF5QixFQUFFLElBQUksQ0FBQyx3REFBd0Q7SUFDMUYsMERBQTBEOztJQUV4RCxlQUFlLEVBQUUsSUFBSSxDQUFDLG1HQUFtRzs7SUFDekgsV0FBVyxFQUFFLGdCQUFnQjtJQUM3QixPQUFPLEVBQUUsNENBQTRDO0lBQ3JELE1BQU0sRUFBRSwyQkFBMkI7SUFDckMsMENBQTBDOztJQUN4QyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixJQUFJLHlCQUF5QjtJQUNoRixXQUFXLEVBQUUsUUFBUTtJQUNyQixrQkFBa0IsRUFBRSxRQUFRO0lBQzVCLGdCQUFnQixFQUFFLGtGQUFrRjtJQUNwRyxhQUFhLEVBQUUsSUFBSTtJQUNyQixrRkFBa0Y7Q0FDbkYsQ0FBQTtBQUVELE9BQU8sQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDeEQsOEJBQThCLENBQUMsQ0FBQyxDQUFDLDhCQUE4QixDQUFDIn0=
