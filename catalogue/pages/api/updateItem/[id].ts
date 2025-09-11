import type { NextApiRequest, NextApiResponse } from "next";
import { client } from "../../../lib/sanity.client";

type UpdateItemResponse =
  | { success: true; doc: { _id: string; modelNumber: number } }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateItemResponse>
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const { assetId, sizes, weightAdult, weightKids } = req.body as {
    assetId?: string;
    sizes?: string[];
    weightAdult?: number;
    weightKids?: number;
  };

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing item id" });
  }

  if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
    return res.status(400).json({ error: "Sizes are required" });
  }

  if (sizes.includes("Adult") && (weightAdult === undefined || isNaN(weightAdult))) {
    return res.status(400).json({ error: "Adult weight is required" });
  }

  if (sizes.includes("Kids") && (weightKids === undefined || isNaN(weightKids))) {
    return res.status(400).json({ error: "Kids weight is required" });
  }

  try {
    let patch = client.patch(id);

    // Update image if provided
    if (assetId) {
      patch = patch.set({
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: assetId },
        },
      });
    }

    // Update sizes and weights
    patch = patch.set({
      sizes,
      weightAdult: sizes.includes("Adult") ? weightAdult : undefined,
      weightKids: sizes.includes("Kids") ? weightKids : undefined,
    });

    const updatedDoc = await patch.commit();

    res.status(200).json({
      success: true,
      doc: { _id: updatedDoc._id, modelNumber: updatedDoc.modelNumber },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: (error as Error).message });
  }
}