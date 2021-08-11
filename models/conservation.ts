import { model, Schema, Document } from "mongoose";
export interface ConservationDoc extends Document {
  slug: string;
  name: string;
  description: string;
  mapUrl: string;
  coverImage: string;
  created: Date;
  lastUpdated: Date;
  stakeholders: string[];
}

const conservationSchema = new Schema<ConservationDoc>({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  mapUrl: { type: String, required: true },
  coverImage: { type: String, required: true },
  created: { type: Date, default: Date.now, required: true },
  lastUpdated: { type: Date, default: Date.now, required: true },
  stakeholders: [{ type: String, required: true }],
});

const Conservation = model<ConservationDoc>("Conservation", conservationSchema);
export default Conservation;
