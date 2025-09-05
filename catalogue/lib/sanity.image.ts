import imageUrlBuilder from "@sanity/image-url";
import { client } from "./sanity.client";

const builder = imageUrlBuilder(client);

/**
 * Generates a URL for a Sanity image.
 * @param source - Sanity image object
 */
export function urlFor(source: object) {
  return builder.image(source);
}
