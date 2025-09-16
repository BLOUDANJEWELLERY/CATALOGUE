// pages/index.tsx:
"use client";
import { saveAs } from "file-saver";
import { getCroppedImg } from "../utils/cropImage"; // adjust the path
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
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

const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
const [zoom, setZoom] = useState<number>(1);
const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

// Component-level state
const [isProcessing, setIsProcessing] = useState(false); // tracks sign out or PDF download

const [pdfFilter, setPdfFilter] = useState<"Adult" | "Kids" | "Both">("Both");
// Handle checkbox selection
const handleSizeChange = (size: "Adult" | "Kids") => {
  setNewItemSizes((prev) =>
    prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
  );
};


const handleEditClick = (item: CatalogueItem) => {
  setEditingId(item._id);
  setCurrentEditImageUrl(item.image ? urlFor(item.image).width(500).url() : "");
  setEditSizes(item.sizes || []);
  setEditImage(null);          // important
  setEditImagePreview(null);   // important
setEditWeightAdult(item.weightAdult?.toString() || "");
  setEditWeightKids(item.weightKids?.toString() || "");
};

const handleEditSizeChange = (size: "Adult" | "Kids") => {
  setEditSizes(prev =>
    prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
  );
};


const handleSaveEdit = async (itemId: string) => {
  // Validations
  if (editSizes.length === 0) return alert("Select at least one size");
  if (editSizes.includes("Adult") && !editWeightAdult) return alert("Enter Adult weight");
  if (editSizes.includes("Kids") && !editWeightKids) return alert("Enter Kids weight");

  setIsUploading(true);

  try {
    let assetIdToSend: string | undefined;

    // If user selected a new image, crop it first
    if (editImage) {
      let finalImageFile = editImage;

      if (croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(
          editImagePreview || currentEditImageUrl || "",
          croppedAreaPixels
        );
        finalImageFile = new File([croppedBlob], editImage.name, { type: "image/jpeg" });
      }

      const formData = new FormData();
      formData.append("file", finalImageFile);
      const uploadRes = await fetch("/api/uploadImage", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      assetIdToSend = uploadData.assetId;
    }

    // Update item details
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

    // Reset modal states
    setEditingId(null);
    setEditImage(null);
    setEditImagePreview("");
    setCroppedAreaPixels(null);

    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("Failed to update item");
  } finally {
    setIsUploading(false);
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
    let finalFile = newItemImage;

    // Crop if area is defined
    if (croppedAreaPixels && newItemImagePreview) {
      const croppedBlob = await getCroppedImg(newItemImagePreview, croppedAreaPixels);
      finalFile = new File([croppedBlob], newItemImage.name, { type: "image/jpeg" });
    }

    // Upload image
    const formData = new FormData();
    formData.append("file", finalFile);
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

    // Reset states and refresh
    setShowAddModal(false);
    setNewItemImage(null);
    setNewItemImagePreview("");
    setCroppedAreaPixels(null);

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
        scale: 3,
        useCORS: true,
        // @ts-expect-error html2canvas accepts this at runtime but types don't include it
        imageSmoothingEnabled: false,
      });
      const finalImgData = canvas.toDataURL("image/jpeg", 1); // JPEG 95%, visually identical
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

  // Convert PDF to Blob
  const pdfArrayBuffer = doc.output("arraybuffer");
  const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });

  // Define an interface for File System Access API
  interface WindowWithFSAccess extends Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<{
      createWritable: () => Promise<WritableStreamDefaultWriter>;
    }>;
  }

  const win = window as WindowWithFSAccess;

  if (typeof win.showSaveFilePicker === "function") {
    try {
      const handle = await win.showSaveFilePicker({
        suggestedName: "BLOUDAN_BANGLES_CATALOGUE.pdf",
        types: [
          {
            description: "PDF Files",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(pdfBlob);
      await writable.close();
      alert("PDF has been saved to your device!");
      return;
    } catch (err) {
      console.error("Save cancelled or failed", err);
      alert("PDF save cancelled or failed.");
      return;
    }
  }

  // Edge / IE fallback
  if ("msSaveOrOpenBlob" in navigator) {
    (navigator as unknown as { msSaveOrOpenBlob: (blob: Blob, name: string) => void }).msSaveOrOpenBlob(
      pdfBlob,
      "BLOUDAN_BANGLES_CATALOGUE.pdf"
    );
    alert("PDF has been saved to your device!");
    return;
  }

  // Fallback: link click (desktop, iOS, Android)
  const link = document.createElement("a");
  link.href = URL.createObjectURL(pdfBlob);
  link.download = "BLOUDAN_BANGLES_CATALOGUE.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);

  alert("PDF download triggered!");


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

 
const modalStyles: { overlay: React.CSSProperties; content: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)", // subtle dark overlay
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    background: "#fdf8f3",           // catalogue page background
    borderRadius: "20px",
    padding: "30px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.2)", // soft shadow
    border: "2px solid #c7a332",    // golden accent border
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
};

const closeEditModal = () => {
  setEditingId(null);
  setEditImage(null);
  setEditImagePreview(null);
  setCurrentEditImageUrl("");
  setEditSizes([]);
  setEditWeightAdult("");
  setEditWeightKids("");
};

useEffect(() => {
  if (showAddModal || editingId) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}, [showAddModal, editingId]);


// Lock scroll while processing
useEffect(() => {
  if (isProcessing) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}, [isProcessing]);


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
  <h1 className="text-4xl font-bold text-[#0b1a3d] text-center mb-6">
    Bloudan Catalogue
  </h1>
<div className="flex justify-center mb-4">
  <button
    onClick={async () => {
      setIsProcessing(true);
      try {
        await handleSignOut();
      } finally {
        setIsProcessing(false);
      }
    }}
    className="px-4 py-2 bg-[#c7a332] text-[#0b1a3d] font-bold rounded-lg hover:bg-[#b5942b] transition"
  >
    Sign Out
  </button>
</div>

<div className="flex justify-center gap-3 mb-8 flex-wrap">
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
      setIsProcessing(true);
      try {
        await handleDownloadPDF(pdfFilter);
      } finally {
        setIsProcessing(false);
      }
    }}
    disabled={isProcessing}
    className={`px-4 py-2 rounded-lg font-semibold transition ${
      isProcessing
        ? "bg-[#8c6b1d] text-[#0b1a3d] cursor-not-allowed"
        : "bg-[#c7a332] text-[#0b1a3d] hover:bg-[#b5942b]"
    }`}
  >
    {isProcessing ? "Processing..." : "Download PDF"}
  </button>
</div>

{/* Full-page overlay */}
{isProcessing && (
  <div className="fixed inset-0 backdrop-blur-sm bg-[#fdf8f3]/40 z-[9999] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-[#c7a332] border-t-[#0b1a3d] rounded-full animate-spin"></div>
  </div>
)}

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
      <span className="text-[#0b1a3d] font-semibold text-lg">+ Add New Item</span>
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
          <p
  className="text-[#0b1a3d] font-semibold mt-3"
  style={{ fontSize: '28px' }}
>
  B{item.modelNumber}
</p>
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
  <div className="fixed inset-0 backdrop-blur-sm bg-transparent flex justify-center items-center z-50">
<div className="bg-[#fdf8f3] rounded-2xl p-8 w-full max-w-md shadow-lg border-2 border-[#c7a332] flex flex-col gap-4">
      
      <h2 className="text-2xl font-bold text-[#0b1a3d] text-center">
        Add New Catalogue Item
      </h2>

      {/* Image Upload */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          setNewItemImage(file);
          if (file) setNewItemImagePreview(URL.createObjectURL(file));
        }}
        className="border-2 border-[#c7a332] rounded-lg p-2 w-full bg-white text-[#0b1a3d] cursor-pointer"
      />

  {/* Image Preview & Crop */}
{newItemImagePreview && (
  <div className="relative w-full h-64 bg-black">
    <Cropper
      image={newItemImagePreview}
      crop={crop}
      zoom={zoom}
      aspect={1} // ensures square
      onCropChange={setCrop}
      onZoomChange={setZoom}
      onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
    />
  </div>
)}

      {/* Size Selection */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-[#0b1a3d] font-semibold">
          <input
            type="checkbox"
            checked={newItemSizes.includes("Adult")}
            onChange={() => handleSizeChange("Adult")}
            className="w-4 h-4 accent-[#c7a332]"
          />
          Adult
        </label>
        <label className="flex items-center gap-2 text-[#0b1a3d] font-semibold">
          <input
            type="checkbox"
            checked={newItemSizes.includes("Kids")}
            onChange={() => handleSizeChange("Kids")}
            className="w-4 h-4 accent-[#c7a332]"
          />
          Kids
        </label>
      </div>

      {/* Weight Inputs */}
      {newItemSizes.includes("Adult") && (
        <input
          type="number"
          placeholder="Weight Adult (g)"
          value={newItemWeightAdult}
          onChange={(e) => setNewItemWeightAdult(e.target.value)}
          className="border-2 border-[#c7a332] rounded-lg p-2 w-full bg-white text-[#0b1a3d]"
        />
      )}
      {newItemSizes.includes("Kids") && (
        <input
          type="number"
          placeholder="Weight Kids (g)"
          value={newItemWeightKids}
          onChange={(e) => setNewItemWeightKids(e.target.value)}
          className="border-2 border-[#c7a332] rounded-lg p-2 w-full bg-white text-[#0b1a3d]"
        />
      )}

      {/* Buttons */}
{/* Save Item Button */}
<div className="flex justify-between gap-4 mt-4">
  <button
    onClick={async () => {
      setIsUploading(true); // trigger overlay
      try {
        await handleSaveNewItem();
      } finally {
        setIsUploading(false);
      }
    }}
    disabled={isUploading}
    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-[#c7a332] border-2 border-[#0b1a3d] bg-[#0b1a3d] hover:bg-[#0a162d] transition ${
      isUploading ? "opacity-50 cursor-not-allowed" : ""
    }`}
  >
    {isUploading ? "Saving..." : "Save Item"}
  </button>


        <button
          onClick={() => setShowAddModal(false)}
          className="flex-1 px-4 py-2 rounded-lg font-semibold text-[#0b1a3d] border-2 border-[#c7a332] bg-white hover:bg-[#f0e6d9] transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{/* Full-page overlay while saving */}
{isUploading && (
  <div className="fixed inset-0 backdrop-blur-sm bg-[#fdf8f3]/40 z-[9999] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-[#c7a332] border-t-[#0b1a3d] rounded-full animate-spin"></div>
  </div>
)}


{/* Edit Product Modal with Cropper */}
{editingId && (
 <div className="fixed inset-0 backdrop-blur-sm bg-transparent flex justify-center items-center z-50">
<div className="bg-[#fdf8f3] rounded-2xl p-8 w-full max-w-md shadow-lg border-2 border-[#c7a332] flex flex-col gap-4">

      <h2 className="text-2xl font-bold text-[#0b1a3d] text-center">
        Edit Catalogue Item
      </h2>

      {/* Image Cropper */}
      {(editImagePreview || currentEditImageUrl) && (
        <div className="relative w-full h-64 bg-[#0b1a3d] rounded-lg overflow-hidden border-2 border-[#c7a332]">
          <Cropper
            image={editImagePreview || currentEditImageUrl || ""}
            crop={crop}
            zoom={zoom}
            aspect={1} // square crop
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
          />
        </div>
      )}

      {/* Image Upload */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          setEditImage(file);
          if (file) setEditImagePreview(URL.createObjectURL(file));
        }}
        className="border-2 border-[#c7a332] rounded-lg p-2 w-full bg-white text-[#0b1a3d] cursor-pointer"
      />

      {/* Size Selection */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-[#0b1a3d] font-semibold">
          <input
            type="checkbox"
            checked={editSizes.includes("Adult")}
            onChange={() => handleEditSizeChange("Adult")}
            className="w-4 h-4 accent-[#c7a332]"
          />
          Adult
        </label>
        <label className="flex items-center gap-2 text-[#0b1a3d] font-semibold">
          <input
            type="checkbox"
            checked={editSizes.includes("Kids")}
            onChange={() => handleEditSizeChange("Kids")}
            className="w-4 h-4 accent-[#c7a332]"
          />
          Kids
        </label>
      </div>

      {/* Weight Inputs */}
      {editSizes.includes("Adult") && (
        <input
          type="number"
          placeholder="Weight Adult (g)"
          value={editWeightAdult}
          onChange={(e) => setEditWeightAdult(e.target.value)}
          className="border-2 border-[#c7a332] rounded-lg p-2 w-full bg-white text-[#0b1a3d]"
        />
      )}
      {editSizes.includes("Kids") && (
        <input
          type="number"
          placeholder="Weight Kids (g)"
          value={editWeightKids}
          onChange={(e) => setEditWeightKids(e.target.value)}
          className="border-2 border-[#c7a332] rounded-lg p-2 w-full bg-white text-[#0b1a3d]"
        />
      )}

      {/* Buttons */}
  <div className="flex justify-between gap-4 mt-4">
  <button
    onClick={async () => {
      setIsUploading(true); // trigger overlay
      try {
        await handleSaveEdit(editingId);
      } finally {
        setIsUploading(false);
      }
    }}
    disabled={isUploading}
    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-[#c7a332] border-2 border-[#0b1a3d] bg-[#0b1a3d] hover:bg-[#0a162d] transition ${
      isUploading ? "opacity-50 cursor-not-allowed" : ""
    }`}
  >
    {isUploading ? "Saving..." : "Save Changes"}
  </button>

        <button
          onClick={closeEditModal}
          className="flex-1 px-4 py-2 rounded-lg font-semibold text-[#0b1a3d] border-2 border-[#c7a332] bg-white hover:bg-[#f0e6d9] transition"
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