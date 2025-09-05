import type { NextApiRequest, NextApiResponse } from "next";
import { client } from "../../lib/sanity.client";
import formidable, { File } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

type UploadResponse = { assetId: string; assetUrl: string } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Error parsing file upload" });

    const uploadedFile = Array.isArray(files.file)
      ? (files.file[0] as File)
      : (files.file as File | undefined);

    if (!uploadedFile || !uploadedFile.filepath)
      return res.status(400).json({ error: "No file provided" });

    const fileStream = fs.createReadStream(uploadedFile.filepath);

    try {
      const asset = await client.assets.upload("image", fileStream, {
        filename: uploadedFile.originalFilename || "uploaded.png",
      });
      res.status(200).json({ assetId: asset._id, assetUrl: asset.url });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}
