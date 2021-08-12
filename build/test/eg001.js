"use strict";
// Test for eg001
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
// See https://mochajs.org/
const chai = require("chai"),
  expect = chai.expect,
  should = chai.should(),
  fs = require("fs"),
  path = require("path"),
  helpers = require("./testHelpers"),
  eg001 = require("../lib/examples/eg001");
describe("eg001", function () {
  it("create envelope and Signing Ceremony URL should work", function () {
    return __awaiter(this, void 0, void 0, function* () {
      this.timeout(30000); // 30 sec allows for the envelope to be created
      let envelopeArgs = {
          signerEmail: helpers.signerEmail,
          signerName: helpers.signerName,
          signerClientId: helpers.signerClientId,
          dsReturnUrl: "http://example.com",
          dsPingUrl: "http://example.com",
        },
        args = {
          dsAPIclient: helpers.dsAPIclient,
          makePromise: helpers.makePromise,
          accountId: helpers.accountId,
          envelopeArgs: envelopeArgs,
        };
      let results = null;
      try {
        results = yield eg001.worker(args);
      } catch (error) {
        helpers.catchMethod(error);
      }
      // eg redirectUrl = https://demo.docusign.net/Signing/StartInSession.aspx?t=914f97b8-060a-421c-8794-391513e9e780
      let worked = results && results.redirectUrl.indexOf(".docusign.net/Signing/StartInSession") > 0 && results.envelopeId.length > 10;
      expect(worked).to.equal(true);
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0L2VnMDAxLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxpQkFBaUI7Ozs7Ozs7Ozs7QUFFakIsMkJBQTJCO0FBQzNCLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFDdEIsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQ3BCLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQ3RCLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQ2xCLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQ3RCLE9BQU8sR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLEVBQ2xDLEtBQUssR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FDekM7QUFFTCxRQUFRLENBQUUsT0FBTyxFQUFFO0lBQ2pCLEVBQUUsQ0FBQyxzREFBc0QsRUFBRTs7WUFDekQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLCtDQUErQztZQUVwRSxJQUFJLFlBQVksR0FBRztnQkFDWCxXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVc7Z0JBQ2hDLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtnQkFDOUIsY0FBYyxFQUFFLE9BQU8sQ0FBQyxjQUFjO2dCQUN0QyxXQUFXLEVBQUUsb0JBQW9CO2dCQUNqQyxTQUFTLEVBQUUsb0JBQW9CO2FBQ2xDLEVBQ0QsSUFBSSxHQUFHO2dCQUNILFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVztnQkFDaEMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO2dCQUNoQyxTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7Z0JBQzVCLFlBQVksRUFBRSxZQUFZO2FBQzdCLENBQ0o7WUFFRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDbkIsSUFBSTtnQkFBQyxPQUFPLEdBQUcsTUFBTSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO2FBQUM7WUFDeEMsT0FBTyxLQUFLLEVBQUU7Z0JBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTthQUFDO1lBQUEsQ0FBQztZQUUzQyxnSEFBZ0g7WUFDaEgsSUFBSSxNQUFNLEdBQUcsT0FBTztnQkFDbEIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsc0NBQXNDLENBQUMsR0FBRyxDQUFDO2dCQUN2RSxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDakMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsQ0FBQztLQUFBLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=
