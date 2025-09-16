// pages/proxyImage.ts:
import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (!url || typeof url !== "string") return res.status(400).end("Missing URL");

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    // Detect image type from URL
    const extension = url.split(".").pop()?.split("?")[0] || "jpg";
    const mimeType = extension === "png" ? "image/png" : "image/jpeg";

    res.setHeader("Content-Type", mimeType);
    res.send(Buffer.from(buffer));
 } catch {
  res.status(500).end("Failed to fetch image");
}
}
