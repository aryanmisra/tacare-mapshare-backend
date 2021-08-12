import {model, Schema, Document} from "mongoose";
export interface CommitDoc extends Document {
    branchSlug: string;
    slug: string;
    note: string;
    geometry: string;
    attributes: {
        ID_NO: number;
        POPULATION: number;
        SUBSPECIES: string;
        BINOMIAL: string;
        CITATION: string;
        COMPILER: string;
        YEAR: number
    }
}
const commitSchema = new Schema<CommitDoc>({
    branchSlug: {type: String, required: true},
    slug: {type: String, required: true, unique: true},
    note: {type: String},
    geometry: {type: String, required: true},
    attributes: {
        ID_NO: {type: Number},
        POPULATION: {type: Number},
        SUBSPECIES: {type: String},
        BINOMIAL: {type: String},
        CITATION: {type: String},
        COMPILER: {type: String},
        YEAR: {type: Number}
    }
});

const Commit = model<CommitDoc>("Commit", commitSchema);
export default Commit;
