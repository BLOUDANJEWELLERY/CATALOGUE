import type { NextApiRequest, NextApiResponse } from "next";
import { client } from "../../lib/sanity.client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Since we can't receive File directly via JSON, use multer or a FormData parser
    // Here we'll assume req.body.file is a Buffer from multer
    const file = (req as any).file as Express.Multer.File;
    if (!file) return res.status(400).json({ error: "File missing" });

    // Upload image to Sanity
    const uploadedImage = await client.assets.upload("image", file.buffer, {
      filename: file.originalname,
    });

    // Get next modelNumber
    const maxModel: number | null = await client.fetch(
      `*[_type=="catalogueItem"] | order(modelNumber desc)[0].modelNumber`
    );
    const nextModel = (maxModel || 0) + 1;

    // Create new catalogue item
    const newItem = {
      _type: "catalogueItem",
      modelNumber: nextModel,
      image: {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: uploadedImage._id,
        },
      },
    };

    const createdDoc = await client.create(newItem);

    res.status(201).json({ success: true, doc: createdDoc });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to create catalogue item" });
  }
}
