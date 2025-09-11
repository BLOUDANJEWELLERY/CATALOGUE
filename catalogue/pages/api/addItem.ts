import type { NextApiRequest, NextApiResponse } from "next";
import { client } from "../../lib/sanity.client";

interface AddItemBody {
  assetId: string;
  sizes: ("Adult" | "Kids")[];
  weightAdult?: number;
  weightKids?: number;
}

type AddItemResponse =
  | { success: true; doc: { _id: string; modelNumber: number } }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AddItemResponse>
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { assetId, sizes, weightAdult, weightKids } = req.body as AddItemBody;

    if (!assetId) return res.status(400).json({ error: "Missing assetId" });
    if (!sizes || !Array.isArray(sizes) || sizes.length === 0)
      return res.status(400).json({ error: "Select at least one size" });

    // Validate weights based on selected sizes
    if (sizes.includes("Adult") && (weightAdult === undefined || weightAdult <= 0))
      return res.status(400).json({ error: "Provide valid weight for Adult" });
    if (sizes.includes("Kids") && (weightKids === undefined || weightKids <= 0))
      return res.status(400).json({ error: "Provide valid weight for Kids" });

    // Find the highest modelNumber
    const maxModel: number | null = await client.fetch(
      `*[_type=="catalogueItem"] | order(modelNumber desc)[0].modelNumber`
    );
    const nextModel = (maxModel || 0) + 1;

    const newItem = {
      _type: "catalogueItem",
      modelNumber: nextModel,
      image: { _type: "image", asset: { _type: "reference", _ref: assetId } },
      sizes,
      weightAdult: sizes.includes("Adult") ? weightAdult : undefined,
      weightKids: sizes.includes("Kids") ? weightKids : undefined,
    };

    const doc = await client.create(newItem);

    res
      .status(201)
      .json({ success: true, doc: { _id: doc._id, modelNumber: doc.modelNumber } });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}