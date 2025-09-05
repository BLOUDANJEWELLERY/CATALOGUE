import type { NextApiRequest, NextApiResponse } from "next";
import { client } from "../../lib/sanity.client";

interface AddItemBody {
  assetId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { assetId } = req.body as AddItemBody;
    if (!assetId) return res.status(400).json({ error: "Missing assetId" });

    const maxModel: number | null = await client.fetch(
      `*[_type=="catalogueItem"] | order(modelNumber desc)[0].modelNumber`
    );
    const nextModel = (maxModel || 0) + 1;

    const newItem = {
      _type: "catalogueItem",
      modelNumber: nextModel,
      image: { _type: "image", asset: { _type: "reference", _ref: assetId } },
    };

    const createdDoc = await client.create(newItem);
    res.status(201).json({ success: true, doc: createdDoc });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to create catalogue item" });
  }
}
