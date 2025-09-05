import type { NextApiRequest, NextApiResponse } from "next";
import { client } from "../../lib/sanity.client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Get the current max modelNumber
    const maxNumber: number = await client.fetch(
      `max(*[_type == "catalogueItem"].modelNumber)`
    );

    const newItem = {
      _type: "catalogueItem",
      modelNumber: (maxNumber || 0) + 1,
      image: {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: imageUrl, // Sanity asset reference ID
        },
      },
    };

    // Create new document
    const created = await client.create(newItem);

    return res.status(200).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create item" });
  }
}
