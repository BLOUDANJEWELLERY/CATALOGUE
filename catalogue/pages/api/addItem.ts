import type { NextApiRequest, NextApiResponse } from "next";
import { client } from "../../lib/sanity.client";

interface AddItemBody {
  assetId: string;
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
    const { assetId } = req.body as AddItemBody;
    if (!assetId) return res.status(400).json({ error: "Missing assetId" });

    // Find the highest modelNumber
    const maxModel: number | null = await client.fetch(
      `*[_type=="catalogueItem"] | order(modelNumber desc)[0].modelNumber`
    );
    const nextModel = (maxModel || 0) + 1;

    const newItem = {
      _type: "catalogueItem",
      modelNumber: nextModel,
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: assetId },
      },
    };

    const doc = await client.create(newItem);
    res.status(201).json({ success: true, doc: { _id: doc._id, modelNumber: doc.modelNumber } });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
