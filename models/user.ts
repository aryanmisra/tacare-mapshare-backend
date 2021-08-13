import {model, Schema, Document} from "mongoose";
import bcrypt from "bcrypt";
export interface UserDoc extends Document {
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string;
  userType: string;
  created: Date;
  password: string;
  conservationGroups: string[];
  generateHash: (password: string) => string;
  validatePassword: (password: string) => boolean;
}

const userSchema = new Schema<UserDoc>({
  firstName: {type: String},
  lastName: {type: String},
  email: {type: String, unique: true, required: true},
  profilePicture: {type: String},
  userType: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  created: {
    type: Date,
    default: Date.now,
  },
  password: {type: String, required: true},
  conservationGroups: [{type: String}],
}, {timestamps: true});

userSchema.methods.generateHash = function (password: string) {
  return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password: string) {
  return bcrypt.compareSync(password, this.password);
};

const User = model<UserDoc>("User", userSchema);
export default User;
