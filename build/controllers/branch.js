"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const conservation_1 = __importDefault(require("../models/conservation"));
const branch_1 = __importDefault(require("../models/branch"));
const createError = require("http-errors");
const branchRouter = require("express").Router();
branchRouter.get("/conservations", (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const conservations = yield conservation_1.default.find({}).exec();
      res.json(conservations);
    } catch (e) {
      next(e);
    }
  })
);
branchRouter.get("/all", (req, res, next) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const branches = yield branch_1.default.find({}).exec();
      res.json(branches);
    } catch (e) {
      next(e);
    }
  })
);
exports.default = branchRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhbmNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vY29udHJvbGxlcnMvYnJhbmNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMEVBQWtEO0FBQ2xELDhEQUFzQztBQUV0QyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFHM0MsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRWpELFlBQVksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsQ0FBTyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO0lBQzFELElBQUk7UUFDRixNQUFNLGFBQWEsR0FBRyxNQUFNLHNCQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3pELEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7S0FDekI7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNUO0FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUVILFlBQVksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQU8sR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUNoRCxJQUFJO1FBQ0YsTUFBTSxRQUFRLEdBQUcsTUFBTSxnQkFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM5QyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ3BCO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDVDtBQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7QUFFSCxrQkFBZSxZQUFZLENBQUMifQ==
