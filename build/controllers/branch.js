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
const middleware_1 = require("../utils/middleware");
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
        const branches = yield branch_1.default.find({}).exec();
        res.json(branches);
    }
    catch (e) {
        next(e);
    }
}));
branchRouter.post("/create", middleware_1.tokenAuthenticator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.uid).exec();
    const { branchNote, commitNote, features, conservationSlug } = req.body;
    if (user) {
        const branchSlug = crypto_1.randomBytes(8).toString("hex");
        const branch = new branch_1.default({
            conservationSlug: conservationSlug ? conservationSlug : "schweinfurthii",
            slug: branchSlug,
            owner: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                id: req.uid,
            },
            note: branchNote,
        });
        const commitSlug = crypto_1.randomBytes(8).toString("hex");
        const initCommit = new commit_1.default({
            branchSlug: branchSlug,
            slug: commitSlug,
            note: commitNote,
            features: features,
            order: 0,
        });
        yield branch.save();
        yield initCommit.save();
        res.sendStatus(200);
    }
    else {
        next(createError(406, "User does not exist within database."));
    }
}));
branchRouter.post("/commit", middleware_1.tokenAuthenticator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.uid).exec();
    const { branchSlug, commitNote, features } = req.body;
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
            features: features,
            order: order,
        });
        yield commit.save();
        res.sendStatus(200);
    }
    else {
        next(createError(406, "User does not exist within database."));
    }
}));
branchRouter.get("/:id/commits", middleware_1.tokenAuthenticator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.uid).exec();
    if (user) {
        const commits = yield commit_1.default.find({ branchSlug: req.params.id }).sort({ order: -1 }).exec();
        res.json(commits);
    }
    else {
        next(createError(406, "User does not exist within database."));
    }
}));
branchRouter.get("/:id", middleware_1.tokenAuthenticator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.uid).exec();
    if (user) {
        const branch = yield branch_1.default.findOne({ slug: req.params.id }).exec();
        res.json(branch);
    }
    else {
        next(createError(406, "User does not exist within database."));
    }
}));
branchRouter.delete("/:id", middleware_1.tokenAuthenticator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.uid).exec();
    if (user) {
        const branch = yield branch_1.default.findOne({ slug: req.params.id }).exec();
        if (branch) {
            if (req.uid !== branch.owner) {
                res.sendStatus(403);
            }
            branch.status = 2;
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
branchRouter.delete("/commit/:id", middleware_1.tokenAuthenticator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhbmNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vY29udHJvbGxlcnMvYnJhbmNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMEVBQWtEO0FBQ2xELDhEQUFzQztBQUN0QywwREFBa0M7QUFDbEMsbUNBQXFDO0FBQ3JDLDhEQUFzQztBQUN0QyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDM0Msb0RBQXlEO0FBRXpELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUVqRCxZQUFZLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLENBQU8sR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUMxRCxJQUFJO1FBQ0YsTUFBTSxhQUFhLEdBQUcsTUFBTSxzQkFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN6RCxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0tBQ3pCO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDVDtBQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7QUFFSCxZQUFZLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFPLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDaEQsSUFBSTtRQUNGLE1BQU0sUUFBUSxHQUFHLE1BQU0sZ0JBQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDOUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUNwQjtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ1Q7QUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO0FBRUgsWUFB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