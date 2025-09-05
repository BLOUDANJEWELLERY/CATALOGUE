import type { NextApiRequest, NextApiResponse } from "next";
import { client } from "../../../lib/sanity.client";

type UpdateItemResponse =
  | { success: true; doc: { _id: string; modelNumber: number } }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateItemResponse>
) {
  if (req.method !== "PATCH")
    return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query;
  const { assetId } = req.body as { assetId?: string };

  if (!assetId || typeof assetId !== "string")
    return res.status(400).json({ error: "Missing assetId" });

  try {
    const updatedDoc = await client
      .patch(id as string)
      .set({
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: assetId },
        },
      })
      .commit();

    res.status(200).json({ success: true, doc: { _id: updatedDoc._id, modelNumber: updatedDoc.modelNumber } });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
