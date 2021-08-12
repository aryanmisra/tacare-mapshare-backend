"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema = new mongoose_1.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, unique: true, required: true },
  profilePicture: { type: String },
  userType: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  created: {
    type: Date,
    default: Date.now,
  },
  password: { type: String, required: true },
  conservationGroups: [{ type: String }],
});
userSchema.methods.generateHash = function (password) {
  return bcrypt_1.default.hashSync(password, 10);
};
userSchema.methods.validatePassword = function (password) {
  return bcrypt_1.default.compareSync(password, this.password);
};
const User = mongoose_1.model("User", userSchema);
exports.default = User;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL21vZGVscy91c2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsdUNBQW1EO0FBQ25ELG9EQUE0QjtBQWM1QixNQUFNLFVBQVUsR0FBRyxJQUFJLGlCQUFNLENBQVU7SUFDckMsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtJQUMzQixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFO0lBQzFCLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO0lBQ3JELGNBQWMsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7SUFDaEMsUUFBUSxFQUFFO1FBQ1IsSUFBSSxFQUFFLE1BQU07UUFDWixJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDO1FBQ3ZCLE9BQU8sRUFBRSxNQUFNO0tBQ2hCO0lBQ0QsT0FBTyxFQUFFO1FBQ1AsSUFBSSxFQUFFLElBQUk7UUFDVixPQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUc7S0FDbEI7SUFDRCxRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7SUFDMUMsa0JBQWtCLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQztDQUN2QyxDQUFDLENBQUM7QUFFSCxVQUFVLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxVQUFVLFFBQWdCO0lBQzFELE9BQU8sZ0JBQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZDLENBQUMsQ0FBQztBQUVGLFVBQVUsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxRQUFnQjtJQUM5RCxPQUFPLGdCQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckQsQ0FBQyxDQUFDO0FBRUYsTUFBTSxJQUFJLEdBQUcsZ0JBQUssQ0FBVSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDaEQsa0JBQWUsSUFBSSxDQUFDIn0=
