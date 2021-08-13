import {model, Schema, Document} from "mongoose";
export interface BranchDoc extends Document {
  conservationSlug: string;
  slug: string;
  owner: {
    firstName: string;
    lastName: string;
    email: string;
    id: string;
  };
  note: string;
  auditStatus: {
    status: number;
    approvals: number;
    denials: number;
    pending: number;
  };
  active: boolean;
}
const branchSchema = new Schema<BranchDoc>({
  conservationSlug: {type: String, required: true},
  slug: {type: String, required: true, unique: true},
  owner: {
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true},
    id: {type: String, required: true},
  },
  note: {type: String, required: true},
  auditStatus: {
    status: {type: Number, required: true, default: 0}, //0 - hasn't begun virtual audit. 1 - virtual audit pending review. 2 - audit rejected. 3 - audit approved.
    approvals: {type: Number, required: true, default: 0},
    denials: {type: Number, required: true, default: 0},
    pending: {type: Number, required: true, default: 0},
  },
  active: {type: Boolean, default: true}
}, {timestamps: true});

const Branch = model<BranchDoc>("Branch", branchSchema);
export default Branch;
