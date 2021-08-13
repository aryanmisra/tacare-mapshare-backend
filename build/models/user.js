"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
}, { timestamps: true });
userSchema.methods.generateHash = function (password) {
    return bcrypt_1.default.hashSync(password, 10);
};
userSchema.methods.validatePassword = function (password) {
    return bcrypt_1.default.compareSync(password, this.password);
};
const User = mongoose_1.model("User", userSchema);
exports.default = User;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL21vZGVscy91c2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsdUNBQWlEO0FBQ2pELG9EQUE0QjtBQWM1QixNQUFNLFVBQVUsR0FBRyxJQUFJLGlCQUFNLENBQVU7SUFDckMsU0FBUyxFQUFFLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQztJQUN6QixRQUFRLEVBQUUsRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFDO0lBQ3hCLEtBQUssRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDO0lBQ25ELGNBQWMsRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUM7SUFDOUIsUUFBUSxFQUFFO1FBQ1IsSUFBSSxFQUFFLE1BQU07UUFDWixJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDO1FBQ3ZCLE9BQU8sRUFBRSxNQUFNO0tBQ2hCO0lBQ0QsT0FBTyxFQUFFO1FBQ1AsSUFBSSxFQUFFLElBQUk7UUFDVixPQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUc7S0FDbEI7SUFDRCxRQUFRLEVBQUUsRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUM7SUFDeEMsa0JBQWtCLEVBQUUsQ0FBQyxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUMsQ0FBQztDQUNyQyxFQUFFLEVBQUMsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFFdkIsVUFBVSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEdBQUcsVUFBVSxRQUFnQjtJQUMxRCxPQUFPLGdCQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN2QyxDQUFDLENBQUM7QUFFRixVQUFVLENBQUMsT0FBTyxDQUFDLGdCQUFnQixHQUFHLFVBQVUsUUFBZ0I7SUFDOUQsT0FBTyxnQkFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JELENBQUMsQ0FBQztBQUVGLE1BQU0sSUFBSSxHQUFHLGdCQUFLLENBQVUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ2hELGtCQUFlLElBQUksQ0FBQyJ9