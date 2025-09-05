import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { client } from "../../lib/sanity.client";

// Multer config (in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Wrap Next.js API to use multer
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) =>
  new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) reject(result);
      else resolve(result);
    });
  });

export const config = {
  api: {
    bodyParser: false, // required for multer
  },
};

export default async function handler(req: NextApiRequest & { file?: any }, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await runMiddleware(req, res, upload.single("file"));

  if (!req.file) return res.status(400).json({ error: "File missing" });

  try {
    // Upload image to Sanity
    const data = await client.assets.upload("image", req.file.buffer, {
      filename: req.file.originalname,
    });

    // Get max modelNumber
    const maxNumber: number = await client.fetch(`max(*[_type == "catalogueItem"].modelNumber)`);

    const newItem = {
      _type: "catalogueItem",
      modelNumber: (maxNumber || 0) + 1,
      image: {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: data._id,
        },
      },
    };

    const created = await client.create(newItem);

    res.status(200).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
}
