import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const buffer = Buffer.concat(chunks);

      const filePath = path.join(process.cwd(), "public", "latest.pdf");
      fs.writeFileSync(filePath, buffer); // overwrite previous

      res.status(200).json({ success: true, url: "/latest.pdf" });
    });
  } else {
    res.status(405).end();
  }
}