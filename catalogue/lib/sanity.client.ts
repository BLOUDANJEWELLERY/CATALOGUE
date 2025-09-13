// lib/sanity.client.ts
import { createClient } from "next-sanity";
import imageUrlBuilder, { SanityImageSource } from "@sanity/image-url";

export const client = createClient({
  projectId: "lfss7ezq",
  dataset: "production",
  apiVersion: "2023-01-01",
  useCdn: false, // false because we will write data
  token: process.env.SANITY_WRITE_TOKEN, // token with write permission
});

// Create a builder for images
const builder = imageUrlBuilder(client);

// Strongly-typed urlFor
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}