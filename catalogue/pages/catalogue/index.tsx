import { GetServerSideProps } from "next";
import { useState, ChangeEvent, useRef } from "react";
import { client } from "../../lib/sanity.client";
import { urlFor } from "../../lib/sanity.image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { generateCataloguePDF } from '../../utils/generateCataloguePDF';

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
  // Add a "blank" item for the new item form
  const itemsWithBlank: (CatalogueItem & { _id: string })[] = [
    ...items,
    { _id: "blank", modelNumber: 0, image: null, sizes: [], weightAdult: undefined, weightKids: undefined },
  ];


// Modal visibility
const [showAddModal, setShowAddModal] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);

// Uploading state
const [isUploading, setIsUploading] = useState(false);

// Add New Item States
const [newItemImage, setNewItemImage] = useState<File | null>(null);
const [newItemImagePreview, setNewItemImagePreview] = useState<string | null>(null);
const [newItemSizes, setNewItemSizes] = useState<("Adult" | "Kids")[]>([]);
const [newItemWeightAdult, setNewItemWeightAdult] = useState<string>("");
const [newItemWeightKids, setNewItemWeightKids] = useState<string>("");

// Edit Item States
const [editImage, setEditImage] = useState<File | null>(null);
const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
const [currentEditImageUrl, setCurrentEditImageUrl] = useState<string | null>(null);
const [editSizes, setEditSizes] = useState<("Adult" | "Kids")[]>([]);
const [editWeightAdult, setEditWeightAdult] = useState<string>("");
const [editWeightKids, setEditWeightKids] = useState<string>("");

// General
const [uploadingId, setUploadingId] = useState<string | null>(null);
const containerRef = useRef<HTMLDivElement>(null);

// Auto Model Number for Add New Item
const nextModelNumber = items.length > 0 ? Math.max(...items.map(i => i.modelNumber)) + 1 : 1;

const [pdfFilter, setPdfFilter] = useState<"Adult" | "Kids" | "Both">("Both");
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

const [isLoading, setIsLoading] = useState(false);

const handleDownloadPDF = async () => {
  await generateCataloguePDF(items, "Both");
};


// Modal styles
const modalStyles: { overlay: React.CSSProperties; content: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)", // deeper, more luxurious overlay
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    background: "#0b1a3d", // deep navy background
    borderRadius: "20px",
    padding: "25px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.4)", // elevated shadow for premium feel
    color: "#fff", // text color inside modal
    border: "2px solid #c7a332", // subtle golden frame
  },
};

return (
<div style={{ padding: "30px", background: "#0b1a3d", minHeight: "100vh" }}>
  <h1 style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: "20px", color: "#c7a332" }}>
    Our Catalogue
  </h1>

  <div
    style={{
      display: "flex",
      justifyContent: "center",
      marginBottom: "30px",
      gap: "10px",
    }}
  >
    <select
      value={pdfFilter}
      onChange={(e) => setPdfFilter(e.target.value as "Adult" | "Kids" | "Both")}
      style={{
        padding: "10px",
        fontSize: "1rem",
        borderRadius: "8px",
        border: "1px solid #c7a332",
        background: "#fff",
        color: "#0b1a3d",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <option value="Adult">Adult Only</option>
      <option value="Kids">Kids Only</option>
      <option value="Both">Both</option>
    </select>

    <button
      onClick={async () => {
        setIsLoading(true);
        try {
          await handleDownloadPDF(pdfFilter);
        } finally {
          setIsLoading(false);
        }
      }}
      disabled={isLoading}
      style={{
        padding: "10px 20px",
        fontSize: "1rem",
        background: isLoading ? "#8c6b1d" : "#c7a332",
        color: "#0b1a3d",
        border: "none",
        borderRadius: "8px",
        cursor: isLoading ? "not-allowed" : "pointer",
        fontWeight: 600,
        transition: "background 0.3s",
      }}
    >
      {isLoading ? "Generating PDF..." : "Download PDF"}
    </button>
  </div>

  <div
    ref={containerRef}
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: "15px",
      padding: "10px",
    }}
  >
    {/* Add Card */}
    <div
      onClick={() => setShowAddModal(true)}
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "10px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        minHeight: "250px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        textAlign: "center",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 15px 30px rgba(0,0,0,0.25)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
      }}
    >
      <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "#c7a332" }}>+ Add New Item</span>
    </div>

    {/* Existing Items */}
    {items
      .slice()
      .sort((a, b) => b.modelNumber - a.modelNumber)
      .map((item) => (
        <div
          key={item._id}
          onClick={() => handleEditClick(item)}
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            minHeight: "280px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 15px 30px rgba(0,0,0,0.25)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
          }}
        >
          <div
            style={{
              width: "100%",
              paddingTop: "100%",
              position: "relative",
              borderRadius: "16px",
              overflow: "hidden",
              background: "#0b1a3d",
            }}
          >
            {item.image && (
              <img
                src={urlFor(item.image).width(500).url()}
                alt={`B${item.modelNumber}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "16px",
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
                  background: "rgba(0,0,0,0.4)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: 600,
                  color: "#c7a332",
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
              color: "#0b1a3d",
              marginTop: "12px",
            }}
          >
            B{item.modelNumber}
          </p>

          {/* Sizes */}
          <div style={{ marginTop: "5px", display: "flex", gap: "8px" }}>
            {item.sizes?.includes("Adult") && (
              <span
                style={{
                  fontSize: "0.9rem",
                  color: "#0b1a3d",
                  background: "#c7a332",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  fontWeight: 600,
                }}
              >
                Adult {item.weightAdult ? `- ${item.weightAdult}g` : ""}
              </span>
            )}
            {item.sizes?.includes("Kids") && (
              <span
                style={{
                  fontSize: "0.9rem",
                  color: "#0b1a3d",
                  background: "#c7a332",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  fontWeight: 600,
                }}
              >
                Kids {item.weightKids ? `- ${item.weightKids}g` : ""}
              </span>
            )}
          </div>
        </div>
      ))}
  </div>

  {/* Force 2 cards per row on mobile */}
  <style jsx>{`
    @media (max-width: 480px) {
      div[ref] {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }
  `}</style>




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
  src={editImagePreview || currentEditImageUrl || ""}
  alt="Preview"
  style={{
    width: "100%",
    maxHeight: "200px",
    objectFit: "contain",
    borderRadius: "12px",
  }}
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

}
