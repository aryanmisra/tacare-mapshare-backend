"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const conservationSchema = new mongoose_1.Schema({
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    mapUrl: { type: String, required: true },
    coverImage: { type: String, required: true },
    created: { type: Date, default: Date.now, required: true },
    lastUpdated: { type: Date, default: Date.now, required: true },
    stakeholders: [{ type: String, required: true }],
});
const Conservation = mongoose_1.model("Conservation", conservationSchema);
exports.default = Conservation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc2VydmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbW9kZWxzL2NvbnNlcnZhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVDQUFtRDtBQVluRCxNQUFNLGtCQUFrQixHQUFHLElBQUksaUJBQU0sQ0FBa0I7SUFDckQsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7SUFDcEQsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO0lBQ3RDLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtJQUM3QyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7SUFDeEMsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO0lBQzVDLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtJQUMxRCxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7SUFDOUQsWUFBWSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztDQUNqRCxDQUFDLENBQUM7QUFFSCxNQUFNLFlBQVksR0FBRyxnQkFBSyxDQUFrQixjQUFjLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztBQUNoRixrQkFBZSxZQUFZLENBQUMifQ==