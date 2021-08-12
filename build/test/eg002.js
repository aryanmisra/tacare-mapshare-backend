"use strict";
// Test for eg002
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
  eg002 = require("../lib/examples/eg002");
describe("eg002 (test takes a long time to create an envelope with 3 documents)", function () {
  it("create envelope with 3 documents should work", function () {
    return __awaiter(this, void 0, void 0, function* () {
      this.timeout(30000); // 30 sec allows for the envelope to be created
      let envelopeArgs = {
          signerEmail: helpers.signerEmail,
          signerName: helpers.signerName,
          ccEmail: helpers.ccEmail,
          ccName: helpers.ccName,
          status: "sent",
        },
        args = {
          dsAPIclient: helpers.dsAPIclient,
          makePromise: helpers.makePromise,
          accountId: helpers.accountId,
          envelopeArgs: envelopeArgs,
        };
      let results = null;
      try {
        results = yield eg002.worker(args);
      } catch (error) {
        helpers.catchMethod(error);
      }
      let worked = results && results.envelopeId.length > 10;
      expect(worked).to.equal(true);
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWcwMDIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0L2VnMDAyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxpQkFBaUI7Ozs7Ozs7Ozs7QUFFakIsMkJBQTJCO0FBQzNCLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFDdEIsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQ3BCLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQ3RCLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQ2xCLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQ3RCLE9BQU8sR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLEVBQ2xDLEtBQUssR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FDekM7QUFFTCxRQUFRLENBQUUsdUVBQXVFLEVBQUU7SUFDakYsRUFBRSxDQUFDLDhDQUE4QyxFQUFFOztZQUNqRCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsK0NBQStDO1lBRXBFLElBQUksWUFBWSxHQUFHO2dCQUNYLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVztnQkFDaEMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO2dCQUM5QixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87Z0JBQ3hCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtnQkFDdEIsTUFBTSxFQUFFLE1BQU07YUFDakIsRUFDRCxJQUFJLEdBQUc7Z0JBQ0gsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO2dCQUNoQyxXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVc7Z0JBQ2hDLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztnQkFDNUIsWUFBWSxFQUFFLFlBQVk7YUFDN0IsQ0FDSjtZQUVELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztZQUNuQixJQUFJO2dCQUFDLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7YUFBQztZQUN4QyxPQUFPLEtBQUssRUFBRTtnQkFBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFBO2FBQUM7WUFBQSxDQUFDO1lBRTNDLElBQUksTUFBTSxHQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDdkQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsQ0FBQztLQUFBLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIn0=
