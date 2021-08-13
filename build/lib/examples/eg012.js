"use strict";
/**
 * @file
 * Example 012: Embedded NDSE (console)
 * @author DocuSign
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const path = require("path"), fs = require("fs-extra"), validator = require("validator"), docusign = require("docusign-esign"), dsConfig = require("../../dsconfig.js").config;
const eg012 = exports, eg = "eg012", // This example reference.
mustAuthenticate = "/ds/mustAuthenticate", minimumBufferMin = 3, dsReturnUrl = dsConfig.appUrl + "/ds-return";
/**
 * Form page for this application
 */
eg012.getController = (req, res) => {
    // Check that the authentication token is ok with a long buffer time.
    // If needed, now is the best time to ask the user to authenticate
    // since they have not yet entered any information into the form.
    let tokenOK = req.dsAuthCodeGrant.checkToken();
    if (tokenOK) {
        res.render("pages/examples/eg012", {
            csrfToken: req.csrfToken(),
            title: "Embedded DocuSign web tool",
            envelopeOk: req.session.envelopeId,
            source: dsConfig.githubExampleUrl + path.basename(__filename),
            documentation: dsConfig.documentation + eg,
            showDoc: dsConfig.documentation,
        });
    }
    else {
        // Save the current operation so it will be resumed after authentication
        req.dsAuthCodeGrant.setEg(req, eg);
        res.redirect(mustAuthenticate);
    }
};
/**
 * The controller
 * @param {object} req Request obj
 * @param {object} res Response obj
 */
eg012.createController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Step 1. Check the token
    // At this point we should have a good token. But we
    // double-check here to enable a better UX to the user.
    let tokenOK = req.dsAuthCodeGrant.checkToken(minimumBufferMin);
    if (!tokenOK) {
        req.flash("info", "Sorry, you need to re-authenticate.");
        // We could store the parameters of the requested operation
        // so it could be restarted automatically.
        // But since it should be rare to have a token issue here,
        // we'll make the user re-enter the form data after
        // authentication.
        req.dsAuthCodeGrant.setEg(req, eg);
        res.redirect(mustAuthenticate);
    }
    // Step 2. Call the worker method
    let accountId = req.dsAuthCodeGrant.getAccountId(), dsAPIclient = req.dsAuthCodeGrant.getDSApi(), body = req.body, 
    // Additional data validation might also be appropriate
    startingView = validator.escape(body.startingView), args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
        dsReturnUrl: dsReturnUrl,
        startingView: startingView,
        envelopeId: req.session.envelopeId, // may be undefined
    }, results = null;
    try {
        results = yield eg012.worker(args);
    }
    catch (error) {
        let errorBody = error && error.response && error.response.body, 
        // we can pull the DocuSign error code and message from the response body
        errorCode = errorBody && errorBody.errorCode, errorMessage = errorBody && errorBody.message;
        // In production, may want to provide customized error messages and
        // remediation advice to the user.
        res.render("pages/error", { err: error, errorCode: errorCode, errorMessage: errorMessage });
    }
    if (results) {
        // Redirect the user to the NDSE View
        // Don't use an iFrame!
        // State can be stored/recovered using the framework's session or a
        // query parameter on the returnUrl (see the makeSenderViewRequest method)
        res.redirect(results.redirectUrl);
    }
});
/**
 * This function does the work of returning a URL for the NDSE view
 * @param {object} args An object with the following elements: <br/>
 *   <tt>dsAPIclient</tt>: The DocuSign API Client object, already set
 *       with an access token and base url <br/>
 *   <tt>makePromise</tt>: Function for promisfying an SDK method <br/>
 *   <tt>accountId</tt>: Current account Id <br/>
 *   <tt>dsReturnUrl</tt>: the return url back to this app
 *   <tt>envelopeId</tt>: optional envelope for the NDSE to focus on
 */
// ***DS.worker.start ***DS.snippet.1.start
eg012.worker = (args) => __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient), results = null;
    // Step 1. create the NDSE view
    let viewRequest = makeConsoleViewRequest(args), createConsoleViewP = args.makePromise(envelopesApi, "createConsoleView");
    // Call the CreateSenderView API
    // Exceptions will be caught by the calling function
    results = yield createConsoleViewP(args.accountId, { consoleViewRequest: viewRequest });
    let url = results.url;
    console.log(`NDSE view URL: ${url}`);
    return { redirectUrl: url };
});
// ***DS.worker.end ***DS.snippet.1.end
// ***DS.snippet.2.start
function makeConsoleViewRequest(args) {
    let viewRequest = new docusign.ConsoleViewRequest();
    // Set the url where you want the recipient to go once they are done
    // with the NDSE. It is usually the case that the
    // user will never "finish" with the NDSE.
    // Assume that control will not be passed back to your app.
    viewRequest.returnUrl = args.dsReturnUrl;
    if (args.startingView == "envelope" && args.envelopeId) {
        viewRequest.envelopeId = args.envelopeId;
    }
    return viewRequest;
}
// ***DS.snippet.2.end
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMTIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMTIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQzFCLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQ3hCLFNBQVMsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQ2hDLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDcEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNqRCxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ25CLEVBQUUsR0FBRyxPQUFPLEVBQUUsMEJBQTBCO0FBQ3hDLGdCQUFnQixHQUFHLHNCQUFzQixFQUN6QyxnQkFBZ0IsR0FBRyxDQUFDLEVBQ3BCLFdBQVcsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztBQUMvQzs7R0FFRztBQUNILEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDakMscUVBQXFFO0lBQ3JFLGtFQUFrRTtJQUNsRSxpRUFBaUU7SUFDakUsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUMvQyxJQUFJLE9BQU8sRUFBRTtRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUU7WUFDakMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxTQUFTLEVBQUU7WUFDMUIsS0FBSyxFQUFFLDRCQUE0QjtZQUNuQyxVQUFVLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVO1lBQ2xDLE1BQU0sRUFBRSxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7WUFDN0QsYUFBYSxFQUFFLFFB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