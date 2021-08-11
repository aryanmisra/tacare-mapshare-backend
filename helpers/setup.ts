import Conservation from "../models/conservation";
import Branch from "../models/branch";
import { randomBytes } from "crypto";
export const createConservation = async () => {
  const conservation = new Conservation({
    slug: "schweinfurthii",
    name: "The Eastern Chimpanzee",
    description:
      "The eastern chimpanzee is a subspecies of the common chimpanzee and classified as endangered and of global conservation concern, indicating that it has a very high risk of extinction in the wild in the near future. The eastern chimpanzee range covers the Central African Republic, South Sudan, the Democratic Republic of the Congo, Uganda, Rwanda, Burundi, and Tanzania.",
    mapUrl: "https://services3.arcgis.com/LyHBUBQ7sNYDeUPl/arcgis/rest/services/redlist_species_data_schweinfurthii/FeatureServer/0",
    coverImage: "https://i.ibb.co/F5GDpBL/image-16.png",
    stakeholders: ["aryanmisra4@gmail.com", "eshchock1@gmail.com"],
  });
  await conservation.save();
};

export const createBranch = async () => {
  const branch = new Branch({
    conservationSlug: "schweinfurthii",
    slug: randomBytes(8).toString("hex"),
    owner: {
      firstName: "Aryan",
      lastName: "Misra",
      email: "aryanmisra4@gmail.com",
      id: "60ff597329bb6a4dd4cb0796",
    },
    note: "Test",
  });
  await branch.save();
};
