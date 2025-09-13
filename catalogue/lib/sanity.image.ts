import imageUrlBuilder from "@sanity/image-url";
import { client } from "./sanity.client";

// Minimal type for Sanity image
export interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
}

const builder = imageUrlBuilder(client);

/**
 * Generates a URL for a Sanity image.
 * @param source - Sanity image object
 */
export function urlFor(source: SanityImage) {
  return builder.image(source);
}