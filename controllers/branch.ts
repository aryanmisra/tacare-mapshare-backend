import Conservation from "../models/conservation";
import Branch from "../models/branch";
import User from "../models/user";
const createError = require("http-errors");
import { tokenAuthenticator } from "../utils/middleware";

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

export default branchRouter;
