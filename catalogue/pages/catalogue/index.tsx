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
  sizes: ("Adult" | "Kids")[];
  weightAdult?: number;
  weightKids?: number;
}

interface CatalogueProps {
  items: CatalogueItem[];
}

export const getServerSideProps: GetServerSideProps<CatalogueProps> = async () => {
  const items: CatalogueItem[] = await client.fetch(
    `*[_type == "catalogueItem"] | order(modelNumber asc){
      _id,
      modelNumber,
      image,
      sizes,
      weightAdult,
      weightKids
    }`
  );

  return { props: { items } };
};

export default function Catalogue({ items }: CatalogueProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add a "blank" item for the new item form
  const itemsWithBlank: (CatalogueItem & { _id: string })[] = [
    ...items,
    { _id: "blank", modelNumber: 0, image: null, sizes: [], weightAdult: undefined, weightKids: undefined },
  ];

// State
const [nextModelNumber, setNextModelNumber] = useState(items.length + 1);
const [newItemImage, setNewItemImage] = useState<File | null>(null);
const [newItemSizes, setNewItemSizes] = useState<("Adult" | "Kids")[]>([]);
const [newItemWeightAdult, setNewItemWeightAdult] = useState("");
const [newItemWeightKids, setNewItemWeightKids] = useState("");

const [isUploading, setIsUploading] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [editImage, setEditImage] = useState<File | null>(null);
const [editSizes, setEditSizes] = useState<("Adult" | "Kids")[]>([]);
const [editWeightAdult, setEditWeightAdult] = useState("");
const [editWeightKids, setEditWeightKids] = useState("");
// Handle checkbox selection
const handleSizeChange = (size: "Adult" | "Kids") => {
  setNewItemSizes((prev) =>
    prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
  );
};


const handleEditClick = (item: CatalogueItem) => {
  setEditingId(item._id);
  setEditImage(null); // user can choose new image or keep old
  setEditSizes(item.sizes || []);
  setEditWeightAdult(item.weightAdult?.toString() || "");
  setEditWeightKids(item.weightKids?.toString() || "");
};

const handleEditSizeChange = (size: "Adult" | "Kids") => {
  setEditSizes(prev =>
    prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
  );
};


const handleSaveEdit = async (itemId: string) => {
  if (editSizes.length === 0) return alert("Select at least one size");
  if (editSizes.includes("Adult") && !editWeightAdult) return alert("Enter Adult weight");
  if (editSizes.includes("Kids") && !editWeightKids) return alert("Enter Kids weight");

  setIsUploading(true);

  try {
    let assetIdToSend: string | undefined;

    if (editImage) {
      const formData = new FormData();
      formData.append("file", editImage);
      const uploadRes = await fetch("/api/uploadImage", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      assetIdToSend = uploadData.assetId;
    }

    const updateRes = await fetch(`/api/updateItem/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(assetIdToSend ? { assetId: assetIdToSend } : {}),
        sizes: editSizes,
        weightAdult: editWeightAdult ? parseFloat(editWeightAdult) : undefined,
        weightKids: editWeightKids ? parseFloat(editWeightKids) : undefined,
      }),
    });

    const data = await updateRes.json();
    if (!data.success) throw new Error(data.error || "Failed to save");

    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("Failed to update item");
  } finally {
    setIsUploading(false);
    setEditingId(null);
  }
};


// Handle new item save
const handleSaveNewItem = async () => {
  if (!newItemImage) return alert("Upload an image");
  if (newItemSizes.length === 0) return alert("Select at least one size");
  if (newItemSizes.includes("Adult") && !newItemWeightAdult)
    return alert("Enter weight for Adult");
  if (newItemSizes.includes("Kids") && !newItemWeightKids)
    return alert("Enter weight for Kids");

  setIsUploading(true);

  try {
    const formData = new FormData();
    formData.append("file", newItemImage);

    // Upload image
    const uploadRes = await fetch("/api/uploadImage", { method: "POST", body: formData });
    const uploadData: { assetId: string } = await uploadRes.json();

    // Create new item
    const saveRes = await fetch("/api/addItem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: uploadData.assetId,
        sizes: newItemSizes,
        weightAdult: newItemWeightAdult ? parseFloat(newItemWeightAdult) : undefined,
        weightKids: newItemWeightKids ? parseFloat(newItemWeightKids) : undefined,
      }),
    });

    const data = await saveRes.json();
    if (!data.success) throw new Error(data.error || "Failed to save");

    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("Failed to add new item");
  } finally {
    setIsUploading(false);
  }
};

// Handle existing item image update
const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, itemId: string) => {
  if (!e.target.files?.length) return;
  const file = e.target.files[0];
  setUploadingId(itemId);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("/api/uploadImage", { method: "POST", body: formData });
    const uploadData: { assetId: string } = await uploadRes.json();
    if (!uploadRes.ok) throw new Error("Upload failed");

    const updateRes = await fetch(`/api/updateItem/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId: uploadData.assetId }),
    });
    if (!updateRes.ok) throw new Error("Failed to update item");

    window.location.reload();
  } catch (err) {
    console.error(err);
    setUploadingId(null);
    alert("Failed to update item");
  }
};


// Inside your component
const [isLoading, setIsLoading] = useState(false);

const handleDownloadPDFWithLoading = async () => {
  setIsLoading(true);
  try {
    await handleDownloadPDF(); // your existing PDF function
  } catch (err) {
    console.error("Error generating PDF:", err);
  } finally {
    setIsLoading(false);
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
    <h1 style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: "20px", color: "#8b5e3c" }}>
      Our Catalogue
    </h1>

    <button
      onClick={handleDownloadPDFWithLoading}
      disabled={isLoading}
      style={{
        display: "block",
        margin: "0 auto 30px",
        padding: "10px 20px",
        fontSize: "1rem",
        background: isLoading ? "#a67c5c" : "#8b5e3c",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: isLoading ? "not-allowed" : "pointer",
        transition: "background 0.3s",
      }}
    >
      {isLoading ? "Generating PDF..." : "Download PDF"}
    </button>

    <div
      ref={containerRef}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "20px",
      }}
    >
      {/* Add Card */}
      <div
        onClick={() => setShowAddModal(true)}
        style={{
          background: "#fffaf5",
          borderRadius: "16px",
          padding: "10px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
          minHeight: "250px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "#7a4c2e" }}>+ Add New Item</span>
      </div>

      {/* Existing Items */}
      {items.map((item) => (
        <div
          key={item._id}
          onClick={() => handleEditClick(item)}
          style={{
            background: "#fffaf5",
            borderRadius: "16px",
            padding: "10px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
            minHeight: "250px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
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
          <p style={{ fontSize: "1.2rem", fontWeight: 600, color: "#7a4c2e", marginTop: "10px" }}>
            Model #{item.modelNumber}
          </p>
        </div>
      ))}
    </div>

 {/* Add Product Modal */}
{showAddModal && (
  <div style={modalStyles.overlay}>
    <div style={modalStyles.content}>
      <h2 style={{ color: "#7a4c2e" }}>Add New Catalogue Item</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          setNewItemImage(file);
          if (file) setNewItemImagePreview(URL.createObjectURL(file));
        }}
        style={{ marginBottom: "10px" }}
      />

      {/* Preview */}
      {newItemImagePreview && (
        <div style={{ marginBottom: "10px" }}>
          <img
            src={newItemImagePreview}
            alt="Preview"
            style={{ width: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "12px" }}
          />
        </div>
      )}

      <div style={{ marginBottom: "10px" }}>
        <label style={{ marginRight: "10px" }}>
          <input
            type="checkbox"
            checked={newItemSizes.includes("Adult")}
            onChange={() => handleSizeChange("Adult")}
          />{" "}
          Adult
        </label>
        <label>
          <input
            type="checkbox"
            checked={newItemSizes.includes("Kids")}
            onChange={() => handleSizeChange("Kids")}
          />{" "}
          Kids
        </label>
      </div>

      {newItemSizes.includes("Adult") && (
        <input
          type="number"
          placeholder="Weight Adult (g)"
          value={newItemWeightAdult}
          onChange={(e) => setNewItemWeightAdult(e.target.value)}
          style={{ marginBottom: "10px" }}
        />
      )}
      {newItemSizes.includes("Kids") && (
        <input
          type="number"
          placeholder="Weight Kids (g)"
          value={newItemWeightKids}
          onChange={(e) => setNewItemWeightKids(e.target.value)}
          style={{ marginBottom: "10px" }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={handleSaveNewItem}
          disabled={isUploading}
          style={{
            padding: "8px 16px",
            background: isUploading ? "#a67c5c" : "#8b5e3c",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: isUploading ? "not-allowed" : "pointer",
          }}
        >
          {isUploading ? "Saving..." : "Save Item"}
        </button>
        <button
          onClick={() => setShowAddModal(false)}
          style={{
            padding: "8px 16px",
            background: "#ccc",
            color: "#333",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{/* Edit Product Modal */}
{editingId && (
  <div style={modalStyles.overlay}>
    <div style={modalStyles.content}>
      <h2 style={{ color: "#7a4c2e" }}>Edit Catalogue Item</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          setEditImage(file);
          if (file) setEditImagePreview(URL.createObjectURL(file));
        }}
        style={{ marginBottom: "10px" }}
      />

      {/* Preview */}
      {(editImagePreview || currentEditImageUrl) && (
        <div style={{ marginBottom: "10px" }}>
          <img
            src={editImagePreview || currentEditImageUrl}
            alt="Preview"
            style={{ width: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "12px" }}
          />
        </div>
      )}

      <div style={{ marginBottom: "10px" }}>
        <label style={{ marginRight: "10px" }}>
          <input
            type="checkbox"
            checked={editSizes.includes("Adult")}
            onChange={() => handleEditSizeChange("Adult")}
          />{" "}
          Adult
        </label>
        <label>
          <input
            type="checkbox"
            checked={editSizes.includes("Kids")}
            onChange={() => handleEditSizeChange("Kids")}
          />{" "}
          Kids
        </label>
      </div>

      {editSizes.includes("Adult") && (
        <input
          type="number"
          placeholder="Weight Adult (g)"
          value={editWeightAdult}
          onChange={(e) => setEditWeightAdult(e.target.value)}
          style={{ marginBottom: "10px" }}
        />
      )}
      {editSizes.includes("Kids") && (
        <input
          type="number"
          placeholder="Weight Kids (g)"
          value={editWeightKids}
          onChange={(e) => setEditWeightKids(e.target.value)}
          style={{ marginBottom: "10px" }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={() => handleSaveEdit(editingId)}
          disabled={isUploading}
          style={{
            padding: "8px 16px",
            background: isUploading ? "#a67c5c" : "#8b5e3c",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: isUploading ? "not-allowed" : "pointer",
          }}
        >
          {isUploading ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={() => setEditingId(null)}
          style={{
            padding: "8px 16px",
            background: "#ccc",
            color: "#333",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
  </div>
);

// Modal styles
const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  content: {
    background: "#fffaf5",
    padding: "30px",
    borderRadius: "16px",
    minWidth: "300px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
  },
};
}
