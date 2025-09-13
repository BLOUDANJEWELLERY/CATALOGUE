import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "lfss7ezq",
  dataset: "production",
  apiVersion: "2023-01-01",
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});