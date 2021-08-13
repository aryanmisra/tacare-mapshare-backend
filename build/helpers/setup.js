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
exports.createBranch = exports.createConservation = void 0;
const conservation_1 = __importDefault(require("../models/conservation"));
const branch_1 = __importDefault(require("../models/branch"));
const crypto_1 = require("crypto");
const createConservation = () => __awaiter(void 0, void 0, void 0, function* () {
    const conservation = new conservation_1.default({
        slug: "schweinfurthii",
        name: "The Eastern Chimpanzee",
        description: "The eastern chimpanzee is a subspecies of the common chimpanzee and classified as endangered and of global conservation concern, indicating that it has a very high risk of extinction in the wild in the near future. The eastern chimpanzee range covers the Central African Republic, South Sudan, the Democratic Republic of the Congo, Uganda, Rwanda, Burundi, and Tanzania.",
        mapUrl: "https://services3.arcgis.com/LyHBUBQ7sNYDeUPl/arcgis/rest/services/redlist_species_data_schweinfurthii/FeatureServer/0",
        coverImage: "https://i.ibb.co/F5GDpBL/image-16.png",
        stakeholders: ["aryanmisra4@gmail.com", "eshchock1@gmail.com"],
    });
    yield conservation.save();
});
exports.createConservation = createConservation;
const createBranch = () => __awaiter(void 0, void 0, void 0, function* () {
    const branch = new branch_1.default({
        conservationSlug: "schweinfurthii",
        slug: crypto_1.randomBytes(8).toString("hex"),
        owner: {
            firstName: "Aryan",
            lastName: "Misra",
            email: "aryanmisra4@gmail.com",
            id: "60ff597329bb6a4dd4cb0796",
        },
        note: "Test",
    });
    yield branch.save();
});
exports.createBranch = createBranch;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9oZWxwZXJzL3NldHVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBFQUFrRDtBQUNsRCw4REFBc0M7QUFFdEMsbUNBQXFDO0FBQzlCLE1BQU0sa0JBQWtCLEdBQUcsR0FBUyxFQUFFO0lBQzNDLE1BQU0sWUFBWSxHQUFHLElBQUksc0JBQVksQ0FBQztRQUNwQyxJQUFJLEVBQUUsZ0JBQWdCO1FBQ3RCLElBQUksRUFBRSx3QkFBd0I7UUFDOUIsV0FBVyxFQUNULG9YQUFvWDtRQUN0WCxNQUFNLEVBQUUsd0hBQXdIO1FBQ2hJLFVBQVUsRUFBRSx1Q0FBdUM7UUFDbkQsWUFBWSxFQUFFLENBQUMsdUJBQXVCLEVBQUUscUJBQXFCLENBQUM7S0FDL0QsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDNUIsQ0FBQyxDQUFBLENBQUM7QUFYVyxRQUFBLGtCQUFrQixzQkFXN0I7QUFFSyxNQUFNLFlBQVksR0FBRyxHQUFTLEVBQUU7SUFDckMsTUFBTSxNQUFNLEdBQUcsSUFBSSxnQkFBTSxDQUFDO1FBQ3hCLGdCQUFnQixFQUFFLGdCQUFnQjtRQUNsQyxJQUFJLEVBQUUsb0JBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQ3BDLEtBQUssRUFBRTtZQUNMLFNBQVMsRUFBRSxPQUFPO1lBQ2xCLFFBQVEsRUFBRSxPQUFPO1lBQ2pCLEtBQUssRUFBRSx1QkFBdUI7WUFDOUIsRUFBRSxFQUFFLDBCQUEwQjtTQUMvQjtRQUNELElBQUksRUFBRSxNQUFNO0tBQ2IsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDdEIsQ0FBQyxDQUFBLENBQUM7QUFiVyxRQUFBLFlBQVksZ0JBYXZCIn0=