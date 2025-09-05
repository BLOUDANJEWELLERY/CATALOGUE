import type { NextApiRequest, NextApiResponse } from "next";
import multer, { FileFilterCallback } from "multer";
import { client } from "../../lib/sanity.client";

// Configure Multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Extend NextApiRequest to include Multer file
interface NextApiRequestWithFile extends NextApiRequest {
  file?: Express.Multer.File;
}

// Disable Next.js body parser (Multer will handle file)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Type-safe middleware runner for Next.js
function runMiddleware(
  req: NextApiRequestWithFile,
  res: NextApiResponse,
  fn: (
    req: NextApiRequestWithFile,
    res: NextApiResponse,
    next: (err?: unknown) => void
  ) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req, res, (err?: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export default async function handler(
  req: NextApiRequestWithFile,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Run Multer middleware (type-safe)
  await runMiddleware(req, res, upload.single("file"));

  if (!req.file) return res.status(400).json({ error: "File missing" });

  try {
    // Upload image to Sanity
    const data = await client.assets.upload("image", req.file.buffer, {
      filename: req.file.originalname,
    });

    // Get max modelNumber
    const maxNumber: number = await client.fetch(
      `max(*[_type == "catalogueItem"].modelNumber)`
    );

    const newItem = {
      _type: "catalogueItem",
      modelNumber: (maxNumber ?? 0) + 1,
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
