import {model, Schema, Document} from "mongoose";
export interface ConservationDoc extends Document {
    name: string;
    description: string;
    mapUrl: string;
    coverImage: string;
    created: Date;
    lastUpdated: Date;
    stakeholders: string[];
    branches: {
        id: string;
        owner: {
            firstName: string;
            lastName: string;
            email: string;
            id: string;
        },
        note: string;
        auditStatus: {
            status: number;
            approvals: number;
            denials: number;
            pending: number;
        }
    }[]
}

const conservationSchema = new Schema<ConservationDoc>({
    name: {type: String, required: true},
    description: {type: String, required: true},
    mapUrl: {type: String, required: true},
    coverImage: {type: String, required: true},
    created: {type: Date, default: Date.now, required: true},
    lastUpdated: {type: Date, default: Date.now, required: true},
    stakeholders: [{type: String, required: true}],
    branches: [{
        id: {type: String, required: true, unique: true},
        owner: {
            firstName: {type: String, required: true},
            lastName: {type: String, required: true},
            email: {type: String, required: true},
            id: {type: String, required: true}
        },
        note: {type: String, required: true},
        auditStatus: {
            status: {type: Number, required: true, default: 0}, //0 - hasn't begun virtual audit. 1 - virtual audit pending review. 2 - audit rejected. 3 - audit approved.
            approvals: {type: Number, required: true, default: 0},
            denials: {type: Number, required: true, default: 0},
            pending: {type: Number, required: true}
        }
    }]
});


const Conservation = model<ConservationDoc>("Conservation", conservationSchema);
export default Conservation;
