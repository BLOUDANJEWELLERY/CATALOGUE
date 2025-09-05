import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "YOUR_SANITY_PROJECT_ID", // from Sanity Studio
  dataset: "production",
  apiVersion: "2023-01-01",
  useCdn: true,
});
