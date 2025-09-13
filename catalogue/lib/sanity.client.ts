// lib/sanity.client.ts
import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
  projectId: "lfss7ezq",
  dataset: "production",
  apiVersion: "2023-01-01",
  useCdn: false, // false because we will write data
  token: process.env.SANITY_WRITE_TOKEN, // token with write permission
});

// Create a builder for images
const builder = imageUrlBuilder(client);

// Export urlFor so your PDF generator can use it
export function urlFor(source: any) {
  return builder.image(source);
}