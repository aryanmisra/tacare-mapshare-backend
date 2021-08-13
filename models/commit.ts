import { model, Schema, Document } from "mongoose";
export interface CommitDoc extends Document {
  branchSlug: string;
  slug: string;
  note: string;
  features: [
    {
      attributes: {
        ID_NO: number;
        NAME: string;
        POPULATION: number;
        SUBSPECIES: string;
        BINOMIAL: string;
        CITATION: string;
        COMPILER: string;
        YEAR: number;
      };
      geometry: string;
    }
  ];
  order: number;
}
const commitSchema = new Schema<CommitDoc>(
  {
    branchSlug: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    note: { type: String },
    features: [
      {
        geometry: { type: String, required: true },
        attributes: {
          ID_NO: { type: Number },
          NAME: { type: String },
          POPULATION: { type: Number },
          SUBSPECIES: { type: String },
          BINOMIAL: { type: String },
          CITATION: { type: String },
          COMPILER: { type: String },
          YEAR: { type: Number },
        },
      },
    ],
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const Commit = model<CommitDoc>("Commit", commitSchema);
export default Commit;
