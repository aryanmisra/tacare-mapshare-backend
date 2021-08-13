import Conservation from "../models/conservation";
import Branch from "../models/branch";
import User from "../models/user";
import {randomBytes} from "crypto";
import Commit from "../models/commit"
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

branchRouter.get("/all", async (req, res, next) => {
  try {
    const branches = await Branch.find({}).exec();
    res.json(branches);
  } catch (e) {
    next(e);
  }
});

branchRouter.post("/create", async (req, res, next) => {
  const user = await User.findById(req.uid).exec();
  const {branchNote, commitNote, geometry, attributes, conservationSlug} = req.body;
  if (user) {
    const branchSlug = randomBytes(8).toString("hex");
    const branch = new Branch({
      conservationSlug: conservationSlug ? conservationSlug : "schweinfurthii",
      slug: branchSlug,
      owner: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        id: req.uid
      },
      note: branchNote
    })
    const commitSlug = randomBytes(8).toString("hex");
    const initCommit = new Commit({
      branchSlug: branchSlug,
      slug: commitSlug,
      note: commitNote,
      geometry: geometry,
      attributes: attributes,
      order: 0
    })
    await branch.save()
    await initCommit.save()
    res.sendStatus(200)
  } else {
    next(createError(406, "User does not exist within database."));
  }
})

branchRouter.post("/commit", async (req, res, next) => {
  const user = await User.findById(req.uid).exec();
  const {branchSlug, commitNote, geometry, attributes} = req.body;
  if (user) {
    const maxCommit = await Commit.findOne({branchSlug: branchSlug}).sort({order: -1}).exec()
    let order = 1;
    if (maxCommit) {
      order = maxCommit.order + 1
    }
    const commitSlug = randomBytes(8).toString("hex");
    const commit = new Commit({
      branchSlug: branchSlug,
      slug: commitSlug,
      note: commitNote,
      geometry: geometry,
      attributes: attributes,
      order: order
    })
    await commit.save()
    res.sendStatus(200)
  } else {
    next(createError(406, "User does not exist within database."));
  }
})

branchRouter.get("/:id/commits", async (req, res, next) => {
  const user = await User.findById(req.uid).exec();
  if (user) {
    const commits = await Commit.find({branchSlug: req.params.id}).sort({order: -1}).exec()
    res.json(commits)
  } else {
    next(createError(406, "User does not exist within database."));
  }
})

branchRouter.get("/:id", async (req, res, next) => {
  const user = await User.findById(req.uid).exec();
  if (user) {
    const branch = await Branch.findOne({slug: req.params.id}).exec()
    res.json(branch)
  } else {
    next(createError(406, "User does not exist within database."));
  }
})

branchRouter.delete("/:id", async (req, res, next) => {
  const user = await User.findById(req.uid).exec()
  if (user) {
    const branch = await Branch.findOne({slug: req.params.id}).exec()
    if (branch) {
      if (req.uid !== branch.owner) {
        res.sendStatus(403)
      }
      branch.status = 2;
      await branch.save()
      res.sendStatus(200)
    } else {
      res.sendStatus(400)
    }
  } else {
    next(createError(406, "User does not exist within database."));
  }
})

branchRouter.delete("/commit/:id", async (req, res, next) => {
  const user = await User.findById(req.uid).exec()
  if (user) {
    const commit = await Commit.findOne({slug: req.params.id}).exec()
    if (commit) {
      const branch = await Branch.findOne({slug: commit.branchSlug}).exec()
      if (branch) {
        if (req.uid !== branch.owner) {
          res.sendStatus(403)
        }
        await Commit.deleteMany({branchSlug: branch.slug, order: {$gt: commit.order}}).exec()
        res.sendStatus(200)
      } else {
        res.sendStatus(400)
      }
    } else {
      res.sendStatus(400)
    }
  } else {
    next(createError(406, "User does not exist within database."));
  }
})

export default branchRouter;
