import * as config from "./config";

exports.config = {
  dsClientId: process.env.DS_CLIENT_ID || config.dsClientId,
  dsClientSecret: process.env.DS_CLIENT_SECRET || config.dsClientSecret,
  signerEmail: process.env.DS_SIGNER_EMAIL || "{USER_EMAIL}",
  signerName: process.env.DS_SIGNER_NAME || "{USER_NAME}",
  appUrl: process.env.ENVIRONMENT === "production" ? "https://tacare-api.herokuapp.com" : "http://localhost:5000",
  production: false,
  debug: true,
  sessionSecret: "12345",
  allowSilentAuthentication: true,
  targetAccountId: null,
  demoDocPath: "documents",
  docDocx: "mapshare_template.docx",
  docPdf: "mapshare_template.pdf",
  gatewayAccountId: "{DS_PAYMENT_GATEWAY_ID}",
  gatewayName: "",
  gatewayDisplayName: "",
  githubExampleUrl: "",
  documentation: null,
};

exports.config.dsOauthServer = exports.config.production ? "https://account.docusign.com" : "https://account-d.docusign.com";
