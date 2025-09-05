import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { client } from "../../lib/sanity.client";

// Extend Next.js request to include Multer file
interface NextApiRequestWithFile extends NextApiRequest {
  file?: Express.Multer.File;
}

// Disable Next.js built-in body parser
export const config = { api: { bodyParser: false } };

// Multer in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to run Multer manually (typed properly)
function multerSingle(
  req: NextApiRequestWithFile,
  res: NextApiResponse,
  fieldName: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const handler = upload.single(fieldName);
    // @ts-expect-error: Multer expects Express Request, safe here
    handler(req, res, (err?: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export default async function handler(
  req: NextApiRequestWithFile,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Run Multer middleware safely
  try {
    await multerSingle(req, res, "file");
  } catch (err) {
    return res.status(500).json({ error: "Multer failed" });
  }

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
