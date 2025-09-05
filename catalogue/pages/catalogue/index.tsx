import { GetServerSideProps } from "next";
import { useState, ChangeEvent, useRef } from "react";
import { client } from "../../lib/sanity.client";
import { urlFor } from "../../lib/sanity.image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface CatalogueItem {
  _id: string;
  modelNumber: number;
  image: { _type: "image"; asset: { _ref: string; _type: "reference" } } | null;
}

interface CatalogueProps {
  items: CatalogueItem[];
}

export const getServerSideProps: GetServerSideProps<CatalogueProps> = async () => {
  const items: CatalogueItem[] = await client.fetch(
    `*[_type == "catalogueItem"] | order(modelNumber asc) { _id, modelNumber, image }`
  );
  return { props: { items } };
};

export default function Catalogue({ items }: CatalogueProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const itemsWithBlank: CatalogueItem[] = [
    ...items,
    { _id: "blank", modelNumber: 0, image: null },
  ];

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, itemId: string) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setUploadingId(itemId);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/uploadImage", { method: "POST", body: formData });
      const uploadData: { assetId: string; assetUrl?: string; error?: string } =
        await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      if (itemId === "blank") {
        const createRes = await fetch("/api/addItem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId: uploadData.assetId }),
        });
        const createData: { success?: true; doc?: CatalogueItem; error?: string } =
          await createRes.json();
        if (!createRes.ok) throw new Error(createData.error || "Failed to create item");
      } else {
        const updateRes = await fetch(`/api/updateItem/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId: uploadData.assetId }),
        });
        const updateData: { success?: true; doc?: CatalogueItem; error?: string } =
          await updateRes.json();
        if (!updateRes.ok) throw new Error(updateData.error || "Failed to update item");
      }

      window.location.reload();
    } catch (error) {
      console.error("Failed to add/update item:", error);
      setUploadingId(null);
    }
  };

const handleDownloadPDF = async () => {
  const doc = new jsPDF("p", "mm", "a4");
  const itemsPerPage = 4;
  const pages = Math.ceil(items.length / itemsPerPage);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Colors
  const bgColor = "#fdf6f0";
  const accentColor = "#8b5e3c";
  const textColor = "#7a4c2e";
  const footerColor = "#8b5e3c";

  for (let pageIndex = 0; pageIndex < pages; pageIndex++) {
    const pageItems = items.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);

    // Header
    doc.setFillColor(...hexToRgb(accentColor));
    doc.rect(0, 0, pageWidth, 25, "F");

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("BLOUDAN JEWELLERY", pageWidth / 2, 12, { align: "center" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("BANGLES CATALOGUE", pageWidth / 2, 20, { align: "center" });

    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i];
      let imgDataUrl = "";

      if (item.image) {
        try {
          const proxyUrl = `/api/proxyImage?url=${encodeURIComponent(
            urlFor(item.image).width(400).auto("format").url()
          )}`;
          const res = await fetch(proxyUrl);
          const blob = await res.blob();
          imgDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error(`Failed to load image for Model #${item.modelNumber}`, err);
        }
      }

      // Offscreen div
      const tempDiv = document.createElement("div");
      tempDiv.style.width = "200px";
      tempDiv.style.height = "250px";
      tempDiv.style.background = bgColor;
      tempDiv.style.display = "flex";
      tempDiv.style.flexDirection = "column";
      tempDiv.style.alignItems = "center";
      tempDiv.style.justifyContent = "flex-start";
      tempDiv.style.border = `2px solid ${accentColor}`;
      tempDiv.style.borderRadius = "16px";
      tempDiv.style.padding = "10px";
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      document.body.appendChild(tempDiv);

      if (imgDataUrl) {
        const tempImg = document.createElement("img");
        tempImg.src = imgDataUrl;
        tempImg.style.width = "100%";
        tempImg.style.maxHeight = "180px";
        tempImg.style.objectFit = "contain";
        tempImg.style.borderRadius = "12px";
        tempDiv.appendChild(tempImg);
      }

      const tempText = document.createElement("p");
      tempText.innerText = `Model #${item.modelNumber}`;
      tempText.style.fontWeight = "700";
      tempText.style.color = textColor;
      tempText.style.marginTop = "8px";
      tempText.style.fontSize = "14px";
      tempDiv.appendChild(tempText);

      const canvas = await html2canvas(tempDiv, { backgroundColor: bgColor, scale: 2 });
      const finalImgData = canvas.toDataURL("image/png");
      document.body.removeChild(tempDiv);

      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col * 95;
      const y = 35 + row * 120;
      doc.addImage(finalImgData, "PNG", x, y, 75, 110);
    }

    // Footer with page number inside diamond
    const footerSize = 10; // diamond width/height
    const cx = pageWidth / 2;
    const cy = pageHeight - 15;

    doc.setFillColor(...hexToRgb(footerColor));
    doc.setDrawColor(...hexToRgb(footerColor));

    // Draw diamond
    doc.lines(
      [
        [0, -footerSize / 2],
        [footerSize / 2, 0],
        [0, footerSize / 2],
        [-footerSize / 2, 0],
        [0, -footerSize / 2],
      ],
      cx,
      cy
    );
    doc.setFillColor(...hexToRgb(footerColor));
    doc.setDrawColor(...hexToRgb(footerColor));
    doc.setLineWidth(0.5);
    doc.rect(cx - footerSize / 2, cy - footerSize / 2, footerSize, footerSize, "FD"); // Fill & stroke

    // Page number
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`${pageIndex + 1}`, cx, cy + 3, { align: "center" });

    if (pageIndex < pages - 1) doc.addPage();
  }

  doc.save("BLOUDAN_BANGLES_CATALOGUE.pdf");
};

// Helper function
function hexToRgb(hex: string): [number, number, number] {
  const match = hex.replace("#", "").match(/.{1,2}/g);
  if (!match) return [0, 0, 0];
  return match.map((x) => parseInt(x, 16)) as [number, number, number];
}

  return (
    <div style={{ padding: "30px", background: "#fdf6f0", minHeight: "100vh" }}>
      <h1
        style={{
          textAlign: "center",
          fontSize: "2.5rem",
          marginBottom: "20px",
          color: "#8b5e3c",
        }}
      >
        Our Catalogue
      </h1>

      <button
        onClick={handleDownloadPDF}
        style={{
          display: "block",
          margin: "0 auto 30px",
          padding: "10px 20px",
          fontSize: "1rem",
          background: "#8b5e3c",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Download PDF
      </button>

      <div
        ref={containerRef}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "20px",
        }}
      >
        {itemsWithBlank.map((item) => (
          <label htmlFor={`file-upload-${item._id}`} key={item._id} style={{ cursor: "pointer" }}>
            <div
              id={`catalogue-item-${item._id}`}
              style={{
                background: "#fffaf5",
                borderRadius: "16px",
                padding: "10px",
                boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                textAlign: "center",
                transition: "transform 0.3s",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "250px",
              }}
            >
              {item._id === "blank" ? (
                <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "#7a4c2e" }}>
                  {uploadingId === "blank" ? "Uploading..." : "+ Add New Item"}
                </span>
              ) : (
                <>
                  <div
                    style={{
                      width: "100%",
                      paddingTop: "100%",
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      background: "#f5f0eb",
                    }}
                  >
                    {item.image && (
                      <img
                        src={urlFor(item.image).width(400).url()}
                        alt={`Model ${item.modelNumber}`}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    )}
                    {uploadingId === item._id && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          background: "rgba(255,255,255,0.6)",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontWeight: 600,
                          color: "#7a4c2e",
                        }}
                      >
                        Uploading...
                      </div>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      color: "#7a4c2e",
                      marginTop: "10px",
                    }}
                  >
                    Model #{item.modelNumber}
                  </p>
                </>
              )}
            </div>
            <input
              id={`file-upload-${item._id}`}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e, item._id)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
