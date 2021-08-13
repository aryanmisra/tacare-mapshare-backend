"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const conservation_1 = __importDefault(require("../models/conservation"));
const branch_1 = __importDefault(require("../models/branch"));
const user_1 = __importDefault(require("../models/user"));
const crypto_1 = require("crypto");
const commit_1 = __importDefault(require("../models/commit"));
const createError = require("http-errors");
const branchRouter = require("express").Router();
branchRouter.get("/conservations", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const conservations = yield conservation_1.default.find({}).exec();
        res.json(conservations);
    }
    catch (e) {
        next(e);
    }
}));
branchRouter.get("/all", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const branches = yield branch_1.default.find({ active: true }).exec();
        res.json(branches);
    }
    catch (e) {
        next(e);
    }
}));
branchRouter.post("/create", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.uid).exec();
    const { branchNote, commitNote, geometry, attributes, conservationSlug } = req.body;
    if (user) {
        const branchSlug = crypto_1.randomBytes(8).toString("hex");
        const branch = new branch_1.default({
            conservationSlug: conservationSlug ? conservationSlug : "schweinfurthii",
            slug: branchSlug,
            owner: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                id: req.uid
            },
            note: branchNote
        });
        const commitSlug = crypto_1.randomBytes(8).toString("hex");
        const initCommit = new commit_1.default({
            branchSlug: branchSlug,
            slug: commitSlug,
            note: commitNote,
            geometry: geometry,
            attributes: attributes,
            order: 0
        });
        yield branch.save();
        yield initCommit.save();
        res.sendStatus(200);
    }
    else {
        next(createError(406, "User does not exist within database."));
    }
}));
branchRouter.post("/commit", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.uid).exec();
    const { branchSlug, commitNote, geometry, attributes } = req.body;
    if (user) {
        const maxCommit = yield commit_1.default.findOne({ branchSlug: branchSlug }).sort({ order: -1 }).exec();
        let order = 1;
        if (maxCommit) {
            order = maxCommit.order + 1;
        }
        const commitSlug = crypto_1.randomBytes(8).toString("hex");
        const commit = new commit_1.default({
            branchSlug: branchSlug,
            slug: commitSlug,
            note: commitNote,
            geometry: geometry,
            attributes: attributes,
            order: order
        });
        yield commit.save();
        res.sendStatus(200);
    }
    else {
        next(createError(406, "User does not exist within database."));
    }
}));
branchRouter.get("/:id/commits", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.uid).exec();
    if (user) {
        const commits = yield commit_1.default.find({ branchSlug: req.params.id }).sort({ order: -1 }).exec();
        res.json(commits);
    }
    else {
        next(createError(406, "User does not exist within database."));
    }
}));
branchRouter.get("/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.uid).exec();
    if (user) {
        const branch = yield branch_1.default.findOne({ slug: req.params.id }).exec();
        res.json(branch);
    }
    else {
        next(createError(406, "User does not exist within database."));
    }
}));
branchRouter.delete("/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.uid).exec();
    if (user) {
        const branch = yield branch_1.default.findOne({ slug: req.params.id }).exec();
        if (branch) {
            if (req.uid !== branch.owner) {
                res.sendStatus(403);
            }
            branch.active = false;
            yield branch.save();
            res.sendStatus(200);
        }
        else {
            res.sendStatus(400);
        }
    }
    else {
        next(createError(406, "User does not exist within database."));
    }
}));
branchRouter.delete("/commit/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.uid).exec();
    if (user) {
        const commit = yield commit_1.default.findOne({ slug: req.params.id }).exec();
        if (commit) {
            const branch = yield branch_1.default.findOne({ slug: commit.branchSlug }).exec();
            if (branch) {
                if (req.uid !== branch.owner) {
                    res.sendStatus(403);
                }
                yield commit_1.default.deleteMany({ branchSlug: branch.slug, order: { $gt: commit.order } }).exec();
                res.sendStatus(200);
            }
            else {
                res.sendStatus(400);
            }
        }
        else {
            res.sendStatus(400);
        }
    }
    else {
        next(createError(406, "User does not exist within database."));
    }
}));
exports.default = branchRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhbmNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vY29udHJvbGxlcnMvYnJhbmNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMEVBQWtEO0FBQ2xELDhEQUFzQztBQUN0QywwREFBa0M7QUFDbEMsbUNBQW1DO0FBQ25DLDhEQUFxQztBQUNyQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFHM0MsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRWpELFlBQVksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsQ0FBTyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO0lBQzFELElBQUk7UUFDRixNQUFNLGFBQWEsR0FBRyxNQUFNLHNCQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3pELEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7S0FDekI7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNUO0FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUVILFlBQVksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQU8sR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUNoRCxJQUFJO1FBQ0YsTUFBTSxRQUFRLEdBQUcsTUFBTSxnQkFBTSxDQUFDLElBQUksQ0FBQyxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzFELEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDcEI7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNUO0FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztB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