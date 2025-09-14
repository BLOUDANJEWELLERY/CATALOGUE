// pages/index.tsx:
"use client";
import { GetServerSidePropsContext, GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { signOut } from "next-auth/react";
import { useState, ChangeEvent, useRef } from "react";
import { client } from "../lib/sanity.client";
import { urlFor } from "../lib/sanity.image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Head from "next/head";
import { useEffect } from "react";

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


export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  // 1. Check session
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  // 2. Fetch catalogue items
  const items = await client.fetch(
    `*[_type == "catalogueItem"] | order(modelNumber asc){
      _id,
      modelNumber,
      image,
      sizes,
      weightAdult,
      weightKids
    }`
  );

  return {
    props: {
      session,
      items,
    },
  };
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


// Inside your component
const [isLoading, setIsLoading] = useState(false);

const handleDownloadPDFWithLoading = async (filter: "Adult" | "Kids" | "Both") => {
  setIsLoading(true);
  try {
    await handleDownloadPDF(filter); // pass the selected filter
  } catch (err) {
    console.error("Error generating PDF:", err);
    alert("Failed to generate PDF. Check console for details.");
  } finally {
    setIsLoading(false);
  }
};

const handleDownloadPDF = async (filter: "Adult" | "Kids" | "Both") => {
  const doc = new jsPDF("p", "mm", "a4");

  // Filter items based on the selected filter
  const filteredItems = items.filter((item) => {
    if (filter === "Adult") return item.sizes?.includes("Adult");
    if (filter === "Kids") return item.sizes?.includes("Kids");
    if (filter === "Both")
      return item.sizes?.includes("Adult") || item.sizes?.includes("Kids");
    return false;
  });

  const itemsPerPage = 4;
  const pages = Math.ceil(filteredItems.length / itemsPerPage);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;

  const accentColor = "#c7a332";
  const cardBg = "#fff";

  for (let pageIndex = 0; pageIndex < pages; pageIndex++) {
    const pageItems = filteredItems.slice(
      pageIndex * itemsPerPage,
      (pageIndex + 1) * itemsPerPage
    );

    // Header
    doc.setFillColor(...hexToRgb(accentColor));
    doc.rect(0, 0, pageWidth, 25, "F");

    doc.setFontSize(20);
    doc.setTextColor(...hexToRgb("#0b1a3d"));
    doc.setFont("helvetica", "bold");
    doc.text("BLOUDAN JEWELLERY", pageWidth / 2, 12, { align: "center" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("BANGLES CATALOGUE", pageWidth / 2, 20, { align: "center" });

    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i];
      let imgDataUrl = "";

      // Fetch image
      if (item.image) {
        try {
          const proxyUrl = `/api/proxyImage?url=${encodeURIComponent(
            urlFor(item.image).width(1200).auto("format").url()
          )}`;
          const res = await fetch(proxyUrl);
          const blob = await res.blob();
          imgDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error(`Failed to load image for B${item.modelNumber}`, err);
        }
      }

      // Offscreen card
      const tempDiv = document.createElement("div");
      tempDiv.style.width = "220px";
      tempDiv.style.height = "260px";
      tempDiv.style.background = cardBg;
      tempDiv.style.display = "flex";
      tempDiv.style.flexDirection = "column";
      tempDiv.style.alignItems = "center";
      tempDiv.style.justifyContent = "flex-start";
      tempDiv.style.border = `2px solid ${accentColor}`;
      tempDiv.style.borderRadius = "16px";
      tempDiv.style.padding = "10px 10px 2px 10px";
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      document.body.appendChild(tempDiv);

      // Image
      if (imgDataUrl) {
        const tempImg = document.createElement("img");
        tempImg.src = imgDataUrl;
        tempImg.style.maxWidth = "100%";
        tempImg.style.maxHeight = "180px";
        tempImg.style.objectFit = "contain";
        tempImg.style.borderRadius = "12px";
        tempImg.style.marginBottom = "0px";
        tempDiv.appendChild(tempImg);
      }

      // Model number
      const tempText = document.createElement("p");
      tempText.innerText = `B${item.modelNumber}`;
      tempText.style.fontWeight = "700";
      tempText.style.color = "#0b1a3d";
      tempText.style.marginTop = "-2px";
      tempText.style.marginBottom = "12px";
      tempText.style.fontSize = "35px";
      tempText.style.lineHeight = "0.8";
      tempDiv.appendChild(tempText);

      // Weights container
      const weightContainer = document.createElement("div");
      weightContainer.style.display = "flex";
      weightContainer.style.width = "100%";
      weightContainer.style.justifyContent = "center"; // always center
      weightContainer.style.marginTop = "0px";
      weightContainer.style.gap = "8px"; // small gap between weights
      tempDiv.appendChild(weightContainer);

      // Determine which weights to show based on filter
      const showAdult = filter === "Adult" || filter === "Both";
      const showKids = filter === "Kids" || filter === "Both";

      if (showAdult && item.sizes?.includes("Adult") && item.weightAdult) {
        const p = document.createElement("p");
        p.innerText = `Adult - ${item.weightAdult}g`;
        p.style.fontSize = "12px";
        p.style.color = "#0b1a3d";
        p.style.margin = "0";
        weightContainer.appendChild(p);
      }

      if (showKids && item.sizes?.includes("Kids") && item.weightKids) {
        const p = document.createElement("p");
        p.innerText = `Kids - ${item.weightKids}g`;
        p.style.fontSize = "12px";
        p.style.color = "#0b1a3d";
        p.style.margin = "0";
        weightContainer.appendChild(p);
      }

      // Render to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 7,
        useCORS: true,
        // @ts-expect-error html2canvas accepts this at runtime but types don't include it
        imageSmoothingEnabled: false,
      });
      const finalImgData = canvas.toDataURL("image/png", 1.0);
      document.body.removeChild(tempDiv);

      // PDF placement
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col * 100;
      const y = 35 + row * 115 + row * 5;
      doc.addImage(finalImgData, "PNG", x, y, 85, 115);
    }

    // Footer
    const footerHeight = 12;
    doc.setFillColor(...hexToRgb(accentColor));
    doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, "F");
    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb("#0b1a3d"));
    doc.setFont("helvetica", "bold");
    doc.text(`Page ${pageIndex + 1}`, pageWidth / 2, pageHeight - 4, { align: "center" });

    if (pageIndex < pages - 1) doc.addPage();
  }

  doc.save(`BLOUDAN_BANGLES_CATALOGUE_${filter}.pdf`);
};

// Helper
function hexToRgb(hex: string): [number, number, number] {
  const match = hex.replace("#", "").match(/.{1,2}/g);
  if (!match) return [0, 0, 0];
  return match.map((x) => parseInt(x, 16)) as [number, number, number];
}


 const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" }); // redirects to homepage
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
    <>
      <Head>
        {/* Page title */}
        <title>BLOUDAN JEWELLERY | Luxury Bangles Collection</title>

        {/* Favicon */}
        <link rel="icon" href="/favicon.PNG" />

        {/* App logo for mobile/Apple devices */}
        <link rel="apple-touch-icon" href="/favicon.PNG" />

        {/* Meta description for SEO */}
        <meta
          name="description"
          content="Explore BLOUDAN JEWELLERY's premium bangles collection. Luxury, elegance, and craftsmanship in every piece."
        />

        {/* Open Graph for social sharing */}
        <meta property="og:title" content="BLOUDAN JEWELLERY | Luxury Bangles Collection" />
        <meta property="og:description" content="Luxury bangles and jewellery crafted to perfection." />
        <meta property="og:image" content="/favicon.PNG" />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BLOUDAN JEWELLERY | Luxury Bangles Collection" />
        <meta name="twitter:description" content="Luxury bangles and jewellery crafted to perfection." />
        <meta name="twitter:image" content="/favicon.PNG" />
      </Head>
<div className="min-h-screen p-8 bg-[#fdf8f3]">
  {/* Header */}
  <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
    <h1 className="text-4xl font-bold text-[#c7a332] text-center md:text-left">
      Bloudan Catalogue
    </h1>

    {/* Controls: Sign Out, Filter, Download */}
    <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-2 md:mt-0">
      <button
        onClick={handleSignOut}
        className="px-4 py-2 bg-[#c7a332] text-[#0b1a3d] font-bold rounded-lg hover:bg-[#b5942b] transition"
      >
        Sign Out
      </button>

      <select
        value={pdfFilter}
        onChange={(e) => setPdfFilter(e.target.value as "Adult" | "Kids" | "Both")}
        className="px-4 py-2 border-2 border-[#c7a332] rounded-lg bg-white text-[#0b1a3d] font-semibold cursor-pointer"
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
        className={`px-4 py-2 rounded-lg font-semibold transition ${
          isLoading
            ? "bg-[#8c6b1d] text-[#0b1a3d] cursor-not-allowed"
            : "bg-[#c7a332] text-[#0b1a3d] hover:bg-[#b5942b]"
        }`}
      >
        {isLoading ? "Generating PDF..." : "Download PDF"}
      </button>
    </div>
  </div>

  {/* Grid of Cards */}
  <div
    ref={containerRef}
    className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  >
    {/* Add New Item Card */}
    <div
      onClick={() => setShowAddModal(true)}
      className="flex justify-center items-center min-h-[250px] bg-white rounded-2xl shadow-lg cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <span className="text-[#c7a332] font-semibold text-lg">+ Add New Item</span>
    </div>

    {/* Existing Items */}
    {items
      .slice()
      .sort((a, b) => b.modelNumber - a.modelNumber)
      .map((item) => (
        <div
          key={item._id}
          onClick={() => handleEditClick(item)}
          className="flex flex-col items-center cursor-pointer bg-white rounded-2xl shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
        >
          {/* Image */}
          <div className="relative w-full pt-[100%] rounded-t-xl bg-[#0b1a3d] overflow-hidden">
            {item.image && (
              <img
                src={urlFor(item.image).width(500).url()}
                alt={`B${item.modelNumber}`}
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            )}
            {uploadingId === item._id && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex justify-center items-center text-[#c7a332] font-semibold">
                Uploading...
              </div>
            )}
          </div>

          {/* Model Number */}
          <p className="text-[#0b1a3d] font-semibold mt-3 text-lg">B{item.modelNumber}</p>

          {/* Sizes + Weights */}
          <div className="flex flex-wrap justify-center gap-2 mt-2 px-2 pb-3">
            {item.sizes?.includes("Adult") && (
              <span className="text-[#0b1a3d] bg-[#c7a332] px-2 py-1 rounded-md font-semibold text-sm">
                Adult {item.weightAdult ? `- ${item.weightAdult}g` : ""}
              </span>
            )}
            {item.sizes?.includes("Kids") && (
              <span className="text-[#0b1a3d] bg-[#c7a332] px-2 py-1 rounded-md font-semibold text-sm">
                Kids {item.weightKids ? `- ${item.weightKids}g` : ""}
              </span>
            )}
          </div>
        </div>
      ))}
  </div>

  {/* Force 2 cards per row on small screens */}
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
</>
);

}