"use strict";
/**
 * @file
 * Example 003: List envelopes in the user's account
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
const docusign = require("docusign-esign"), dsConfig = require("../../dsconfig.js").config, moment = require("moment"), path = require("path");
const eg003 = exports, eg = "eg003", // This example reference.
mustAuthenticate = "/ds/mustAuthenticate", minimumBufferMin = 3;
/**
 * Form page for this application
 */
eg003.getController = (req, res) => {
    // Check that the authentication token is ok with a long buffer time.
    // If needed, now is the best time to ask the user to authenticate
    // since they have not yet entered any information into the form.
    let tokenOK = req.dsAuthCodeGrant.checkToken();
    if (tokenOK) {
        res.render("pages/examples/eg003", {
            csrfToken: req.csrfToken(),
            title: "List envelopes",
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
 * List envelopes in the user's account
 * @param {object} req Request obj
 * @param {object} res Response obj
 */
eg003.createController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    let accountId = req.dsAuthCodeGrant.getAccountId(), dsAPIclient = req.dsAuthCodeGrant.getDSApi(), args = {
        dsAPIclient: dsAPIclient,
        makePromise: req.dsAuthCodeGrant.makePromise,
        accountId: accountId,
    }, results = null;
    try {
        results = yield eg003.worker(args);
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
        res.render("pages/example_done", {
            title: "List envelopes results",
            h1: "List envelopes results",
            message: `Results from the Envelopes::listStatusChanges method:`,
            json: JSON.stringify(results),
        });
    }
});
/**
 * This function does the work of listing the envelopes
 * @param {object} args An object with the following elements: <br/>
 *   <tt>dsAPIclient</tt>: The DocuSign API Client object, already set with an access token and base url <br/>
 *   <tt>makePromise</tt>: Function for promisfying an SDK method <br/>
 *   <tt>accountId</tt>: Current account Id <br/>
 */
// ***DS.worker.start ***DS.snippet.1.start
eg003.worker = (args) => __awaiter(void 0, void 0, void 0, function* () {
    let envelopesApi = new docusign.EnvelopesApi(args.dsAPIclient), listStatusChangesP = args.makePromise(envelopesApi, "listStatusChanges"), results = null;
    // Step 1. List the envelopes
    // The Envelopes::listStatusChanges method has many options
    // See https://developers.docusign.com/esign-rest-api/reference/Envelopes/Envelopes/listStatusChanges
    // The list status changes call requires at least a from_date OR
    // a set of envelopeIds. Here we filter using a from_date.
    // Here we set the from_date to filter envelopes for the last month
    // Use ISO 8601 date format
    let options = { fromDate: moment().subtract(30, "days").format() };
    // Exceptions will be caught by the calling function
    results = yield listStatusChangesP(args.accountId, options);
    return results;
});
// ***DS.worker.end ***DS.snippet.1.end
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZXhhbXBsZXMvZWcwMDMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7QUFFSCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsRUFDeEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLE1BQU0sRUFDOUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFDMUIsSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN6QixNQUFNLEtBQUssR0FBRyxPQUFPLEVBQ25CLEVBQUUsR0FBRyxPQUFPLEVBQUUsMEJBQTBCO0FBQ3hDLGdCQUFnQixHQUFHLHNCQUFzQixFQUN6QyxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7QUFDdkI7O0dBRUc7QUFDSCxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQ2pDLHFFQUFxRTtJQUNyRSxrRUFBa0U7SUFDbEUsaUVBQWlFO0lBQ2pFLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDL0MsSUFBSSxPQUFPLEVBQUU7UUFDWCxHQUFHLENBQUMsTUFBTSxDQUFDLHNCQUFzQixFQUFFO1lBQ2pDLFNBQVMsRUFBRSxHQUFHLENBQUMsU0FBUyxFQUFFO1lBQzFCLEtBQUssRUFBRSxnQkFBZ0I7WUFDdkIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUM3RCxhQUFhLEVBQUUsUUFBUSxDQUFDLGFBQWEsR0FBRyxFQUFFO1lBQzFDLE9BQU8sRUFBRSxRQUFRLENBQUMsYUFBYTtTQUNoQyxDQUFDLENBQUM7S0FDSjtTQUFNO1FBQ0wsd0VBQXdFO1FBQ3hFLEdBQUcsQ0FBQyxlQUFlLENBQUMs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