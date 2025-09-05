import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "lfss7ezq", // from Sanity Studio
  dataset: "production",
  apiVersion: "2023-01-01",
  useCdn: true,
});
