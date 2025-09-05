import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "lfss7ezq",
  dataset: "production",
  apiVersion: "2023-01-01",
  useCdn: false, // false because we will write data
  token: process.env.SANITY_WRITE_TOKEN, // token with write permission
});
