import Conservation from "../models/conservation";
import Branch from "../models/branch";
import User from "../models/user";
import {randomBytes} from "crypto";
import Commit from "../models/commit";
const createError = require("http-errors");
import {tokenAuthenticator} from "../utils/middleware";

const branchRouter = require("express").Router();

branchRouter.get("/conservations", async (req, res, next) => {
  try {
    const conservations = await Conservation.find({}).exec();
    res.json(conservations);
  } catch (e) {
    next(e);
  }
});

branchRouter.get("/conservation/:id", async (req, res, next) => {
  try {
    const branches = await Branch.find({conservationSlug: req.params.id}).exec();
    res.json(branches);
  } catch (e) {
    next(e);
  }
});

branchRouter.post("/create", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findById(req.uid).exec();
  const {branchNote, commitNote, features, conservationSlug} = req.body;
  const pendingUserStatus = await User.find({userType: "user"}).exec()
  if (user) {
    const branchSlug = randomBytes(8).toString("hex");
    const branch = new Branch({
      conservationSlug: conservationSlug ? conservationSlug : "schweinfurthii",
      slug: branchSlug,
      owner: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        id: req.uid,
      },
      note: branchNote,
      auditStatus: {
        pending: pendingUserStatus?.length
      }
    });
    const commitSlug = randomBytes(8).toString("hex");
    const initCommit = new Commit({
      branchSlug: branchSlug,
      slug: commitSlug,
      note: commitNote,
      features: features,
      order: 0,
    });
    await branch.save();
    await initCommit.save();
    res.sendStatus(200);
  } else {
    next(createError(406, "User does not exist within database."));
  }
});

branchRouter.post("/commit", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findById(req.uid).exec();
  const {branchSlug, commitNote, features} = req.body;
  if (user) {
    const maxCommit = await Commit.findOne({branchSlug: branchSlug}).sort({order: -1}).exec();
    let order = 1;
    if (maxCommit) {
      order = maxCommit.order + 1;
    }
    const commitSlug = randomBytes(8).toString("hex");
    const commit = new Commit({
      branchSlug: branchSlug,
      slug: commitSlug,
      note: commitNote,
      features: features,
      order: order,
    });
    await commit.save();
    res.sendStatus(200);
  } else {
    next(createError(406, "User does not exist within database."));
  }
});

branchRouter.get("/:id/commits", async (req, res, next) => {
  const commits = await Commit.find({branchSlug: req.params.id}).sort({order: -1}).exec();
  res.json(commits);
});

branchRouter.get("/:id", async (req, res, next) => {
  const branch = await Branch.findOne({slug: req.params.id}).exec();
  res.json(branch);
});

branchRouter.delete("/:id", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findById(req.uid).exec();
  if (user) {
    const branch = await Branch.findOne({slug: req.params.id}).exec();
    if (branch) {
      branch.status = 2;
      await branch.save();
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  } else {
    next(createError(406, "User does not exist within database."));
  }
});

branchRouter.delete("/commit/:id", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findById(req.uid).exec();
  if (user) {
    const commit = await Commit.findOne({slug: req.params.id}).exec();
    if (commit) {
      const branch = await Branch.findOne({slug: commit.branchSlug}).exec();
      if (branch) {
        await Commit.deleteMany({branchSlug: branch.slug, order: {$gt: commit.order}}).exec();
        res.sendStatus(200);
      } else {
        res.sendStatus(400);
      }
    } else {
      res.sendStatus(400);
    }
  } else {
    next(createError(406, "User does not exist within database."));
  }
});

branchRouter.get("/merge/:id", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findById(req.uid).exec();
  if (user) {
    // add checks for audit status

    const branch = await Branch.findOne({slug: req.params.id}).exec();
    const relevantCommit = await Commit.findOne({branchSlug: req.params.id}).sort({order: -1}).exec();
    const maxCommit = await Commit.findOne({branchSlug: "main"}).sort({order: -1}).exec();
    const commitSlug = randomBytes(8).toString("hex");
    let order = 1;
    if (maxCommit) {
      order = maxCommit.order + 1;
    }
    const mergeCommit = new Commit({
      branchSlug: "main",
      slug: commitSlug,
      note: relevantCommit?.note,
      features: relevantCommit?.features,
      order: order,
    });
    if (branch) {
      branch.status = 1;
      await branch.save();
    }
    await mergeCommit.save();
    res.sendStatus(200);
  } else {
    next(createError(406, "User does not exist within database."));
  }
});

export default branchRouter;
