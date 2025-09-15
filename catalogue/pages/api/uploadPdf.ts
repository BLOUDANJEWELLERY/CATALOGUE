import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false, // disable Next.js default body parsing
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("error", (err) => {
      console.error("Upload error:", err);
      res.status(500).json({ success: false, error: "Upload failed" });
    });

    req.on("end", () => {
      try {
        const buffer = Buffer.concat(chunks);
        const filePath = path.join(process.cwd(), "public", "latest.pdf");

        fs.writeFileSync(filePath, buffer); // overwrite previous file

        res.setHeader("Content-Type", "application/json");
        res.status(200).end(JSON.stringify({ success: true, url: "/latest.pdf" }));
      } catch (err) {
        console.error("File save error:", err);
        res.status(500).json({ success: false, error: "File save failed" });
      }
    });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}