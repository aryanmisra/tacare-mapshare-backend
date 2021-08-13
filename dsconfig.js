import * as config from "./config";

exports.config = {
  dsClientId: process.env.DS_CLIENT_ID || config.dsClientId, // The app's DocuSign integration key
  dsClientSecret: process.env.DS_CLIENT_SECRET || config.dsClientSecret, // The app's DocuSign integration key's secret
  signerEmail: process.env.DS_SIGNER_EMAIL || "{USER_EMAIL}",
  signerName: process.env.DS_SIGNER_NAME || "{USER_NAME}",
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
