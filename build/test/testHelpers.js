"use strict";
// Test helpers
// See https://mochajs.org/
const helpers = exports;
const { promisify } = require("util"), // http://2ality.com/2017/05/util-promisify.html
  docusign = require("docusign-esign");
helpers.accessToken = process.env.DS_TEST_ACCESS_TOKEN; // An access token
helpers.accountId = process.env.DS_TEST_ACCOUNT_ID;
helpers.basePath = "https://demo.docusign.net/restapi";
helpers.signerEmail = "ds_test@mailinator.com";
helpers.signerName = "Mocha Tester";
helpers.ccEmail = "ds_test_cc@mailinator.com";
helpers.ccName = "Mocha CC Tester";
helpers.signerClientId = 1000;
helpers.makePromise = function _makePromise(obj, methodName) {
  let promiseName = methodName + "_promise";
  if (!(promiseName in obj)) {
    obj[promiseName] = promisify(obj[methodName]).bind(obj);
  }
  return obj[promiseName];
};
helpers.dsAPIclient = new docusign.ApiClient();
helpers.dsAPIclient.addDefaultHeader("Authorization", "Bearer " + helpers.accessToken);
helpers.dsAPIclient.setBasePath(helpers.basePath);
helpers.catchMethod = error => {
  // This catch statement provides more info on an API problem.
  // To debug mocha:
  // npm test -- --inspect --debug-brk
  let errorBody = error && error.response && error.response.body,
    // we can pull the DocuSign error code and message from the response body
    errorCode = errorBody && errorBody.errorCode,
    errorMessage = errorBody && errorBody.message;
  // In production, may want to provide customized error messages and
  // remediation advice to the user.
  console.log(`err: ${error}, errorCode: ${errorCode}, errorMessage: ${errorMessage}`);
  //throw error; // an unexpected error has occured
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEhlbHBlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0L3Rlc3RIZWxwZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxlQUFlO0FBRWYsMkJBQTJCO0FBQzNCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUN4QixNQUFNLEVBQUMsU0FBUyxFQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGdEQUFnRDtFQUM5RSxRQUFRLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFFM0MsT0FBTyxDQUFDLFdBQVcsR0FBSSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUMsa0JBQWtCO0FBQzNFLE9BQU8sQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQztBQUNuRCxPQUFPLENBQUMsUUFBUSxHQUFHLG1DQUFtQyxDQUFDO0FBQ3ZELE9BQU8sQ0FBQyxXQUFXLEdBQUcsd0JBQXdCLENBQUM7QUFDL0MsT0FBTyxDQUFDLFVBQVUsR0FBRyxjQUFjLENBQUM7QUFDcEMsT0FBTyxDQUFDLE9BQU8sR0FBRywyQkFBMkIsQ0FBQztBQUM5QyxPQUFPLENBQUMsTUFBTSxHQUFHLGlCQUFpQixDQUFDO0FBQ25DLE9BQU8sQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBRTlCLE9BQU8sQ0FBQyxXQUFXLEdBQUcsU0FBUyxZQUFZLENBQUMsR0FBRyxFQUFFLFVBQVU7SUFDdkQsSUFBSSxXQUFXLEdBQUcsVUFBVSxHQUFHLFVBQVUsQ0FBQztJQUMxQyxJQUFJLENBQUMsQ0FBQyxXQUFXLElBQUksR0FBRyxDQUFDLEVBQUU7UUFDekIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDeEQ7SUFDRCxPQUFPLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQTtBQUMzQixDQUFDLENBQUE7QUFFRCxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQy9DLE9BQU8sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLFNBQVMsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDdkYsT0FBTyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRWxELE9BQU8sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRTtJQUM1Qiw2REFBNkQ7SUFDN0Qsa0JBQWtCO0lBQ2xCLG9DQUFvQztJQUNwQyxJQUFJLFNBQVMsR0FBRyxLQUFLLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUk7SUFDMUQseUVBQXlFO01BQ3ZFLFNBQVMsR0FBRyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsRUFDNUMsWUFBWSxHQUFHLFNBQVMsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUM5QztJQUNMLG9FQUFvRTtJQUNwRSxrQ0FBa0M7SUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBRSxRQUFRLEtBQUssZ0JBQWdCLFNBQVMsbUJBQW1CLFlBQVksRUFBRSxDQUFDLENBQUM7SUFFdEYsaURBQWlEO0FBQ3JELENBQUMsQ0FBQSJ9
