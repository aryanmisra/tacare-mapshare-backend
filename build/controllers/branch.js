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
        const branches = yield branch_1.default.find({}).exec();
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
exports.default = branchRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhbmNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vY29udHJvbGxlcnMvYnJhbmNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMEVBQWtEO0FBQ2xELDhEQUFzQztBQUN0QywwREFBa0M7QUFDbEMsbUNBQW1DO0FBQ25DLDhEQUFxQztBQUNyQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFHM0MsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRWpELFlBQVksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsQ0FBTyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO0lBQzFELElBQUk7UUFDRixNQUFNLGFBQWEsR0FBRyxNQUFNLHNCQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3pELEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7S0FDekI7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNUO0FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUVILFlBQVksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQU8sR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUNoRCxJQUFJO1FBQ0YsTUFBTSxRQUFRLEdBQUcsTUFBTSxnQkFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM5QyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ3BCO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDVDtBQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7QUFFSCxZQUFZLENBQUMsSUFBSSxD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