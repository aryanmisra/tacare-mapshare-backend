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
exports.servererror = exports.invalidlink = exports.emailverified = exports.emailVerify = void 0;
const config = __importStar(require("../config"));
const emailVerify = email_code => {
  return {
    header: "Verify your Tacare MapShare email",
    body:
      `<!DOCTYPE html><html><head><title>Tacare Email Verification</title><body>` +
      `<p>Click <a href="${config.URL}user/verify-email/${email_code}">here</a> to verify your email. If this wasn't you, simply ignore this email.</p>` +
      `<p>If you can't click on the link, paste this into your broswer: ${config.URL}user/verify-email/${email_code}` +
      `</body></html>`,
  };
};
exports.emailVerify = emailVerify;
exports.emailverified =
  '<!DOCTYPE html><html><body><p>Your email has been successfully verified.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>';
exports.invalidlink =
  '<!DOCTYPE html><html><body><p>The link is invalid.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>';
exports.servererror =
  '<!DOCTYPE html><html><body><p>An error has occurred.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbEJvZHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi91dGlscy9tYWlsQm9keS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0RBQW9DO0FBRTdCLE1BQU0sV0FBVyxHQUFHLENBQUMsVUFBa0IsRUFBRSxFQUFFO0lBQ2hELE9BQU87UUFDTCxNQUFNLEVBQUUsbUNBQW1DO1FBQzNDLElBQUksRUFDRiwyRUFBMkU7WUFDM0UscUJBQXFCLE1BQU0sQ0FBQyxHQUFHLHFCQUFxQixVQUFVLG9GQUFvRjtZQUNsSixvRUFBb0UsTUFBTSxDQUFDLEdBQUcscUJBQXFCLFVBQVUsRUFBRTtZQUMvRyxnQkFBZ0I7S0FDbkIsQ0FBQztBQUNKLENBQUMsQ0FBQztBQVRXLFFBQUEsV0FBVyxlQVN0QjtBQUVXLFFBQUEsYUFBYSxHQUN4QixtS0FBbUssQ0FBQztBQUN6SixRQUFBLFdBQVcsR0FDdEIsNklBQTZJLENBQUM7QUFDbkksUUFBQSxXQUFXLEdBQ3RCLCtJQUErSSxDQUFDIn0=
