// /pages/api/catalogue/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { client } from "../../lib/sanity.client";
import { v4 as uuidv4 } from "uuid";

interface CatalogueItemBody {
  imageAssetId: string; // Sanity asset ID of the uploaded image
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageAssetId } = req.body as CatalogueItemBody;

    if (!imageAssetId)
      return res.status(400).json({ error: "Missing imageAssetId" });

    // Find the current max modelNumber
    const maxModel: number | null = await client.fetch(
      `*[_type=="catalogueItem"] | order(modelNumber desc)[0].modelNumber`
    );
    const nextModel = (maxModel ?? 0) + 1;

    // Build catalogue item document
    const catalogueItem = {
      _type: "catalogueItem",
      _id: uuidv4(),
      modelNumber: nextModel,
      image: {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: imageAssetId,
        },
      },
      createdAt: new Date().toISOString(),
    };

    // Save to Sanity
    const createdDoc = await client.create(catalogueItem);

    res.status(201).json({ success: true, doc: createdDoc });
  } catch (error: unknown) {
    console.error("Error creating catalogue item:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create catalogue item";
    res.status(500).json({ error: message });
  }
}
