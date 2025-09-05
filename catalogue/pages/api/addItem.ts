import type { NextApiRequest, NextApiResponse } from "next";
import type { File } from "multer"; // for file typing
import multer from "multer";
import { client } from "../../lib/sanity.client";

// Multer in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Helper for middleware
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: Function) =>
  new Promise<void>((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) reject(result);
      else resolve();
    });
  });

// Extend request type
interface NextApiRequestWithFile extends NextApiRequest {
  file?: Express.Multer.File;
}

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: NextApiRequestWithFile,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  await runMiddleware(req, res, upload.single("file"));

  if (!req.file) return res.status(400).json({ error: "File missing" });

  try {
    const data = await client.assets.upload("image", req.file.buffer, {
      filename: req.file.originalname,
    });

    const maxNumber: number = await client.fetch(`max(*[_type == "catalogueItem"].modelNumber)`);

    const newItem = {
      _type: "catalogueItem",
      modelNumber: (maxNumber || 0) + 1,
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: data._id },
      },
    };

    const created = await client.create(newItem);

    res.status(200).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
}
