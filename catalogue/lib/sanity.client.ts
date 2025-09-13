// lib/sanity.client.ts
import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageObject } from "next-sanity"; // correct type

export const client = createClient({
  projectId: "lfss7ezq",
  dataset: "production",
  apiVersion: "2023-01-01",
  useCdn: false, // false because we will write data
  token: process.env.SANITY_WRITE_TOKEN, // token with write permission
});

const builder = imageUrlBuilder(client);

// Properly typed urlFor function
export function urlFor(source: SanityImageObject) {
  return builder.image(source);
}