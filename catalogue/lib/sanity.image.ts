import imageUrlBuilder from "@sanity/image-url";
import { SanityImageSource } from "@sanity/image-url/lib/types";
import { client } from "./sanity.client";

const builder = imageUrlBuilder(client);

/**
 * Generates a URL for a Sanity image.
 * @param source - Sanity image object
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
