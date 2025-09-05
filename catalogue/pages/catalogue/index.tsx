import { GetServerSideProps } from "next";
import { useState, ChangeEvent } from "react";
import { client } from "../../lib/sanity.client";
import { urlFor } from "../../lib/sanity.image";

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

  const itemsWithBlank: CatalogueItem[] = [
    ...items,
    { _id: "blank", modelNumber: 0, image: null },
  ];

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, itemId: string) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setUploadingId(itemId);

    try {
      // 1️⃣ Upload the image
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
      });
      const uploadData: { assetId: string; assetUrl?: string; error?: string } =
        await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      if (itemId === "blank") {
        // 2️⃣ Create new catalogue item
        const createRes = await fetch("/api/addItem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId: uploadData.assetId }),
        });
        const createData: { success?: true; doc?: CatalogueItem; error?: string } =
          await createRes.json();
        if (!createRes.ok) throw new Error(createData.error || "Failed to create item");
      } else {
        // 2️⃣ Update existing catalogue item image
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

  return (
    <div style={{ padding: "30px", background: "#fdf6f0", minHeight: "100vh" }}>
      <h1
        style={{
          textAlign: "center",
          fontSize: "2.5rem",
          marginBottom: "40px",
          color: "#8b5e3c",
        }}
      >
        Our Catalogue
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "20px",
        }}
      >
        {itemsWithBlank.map((item) => (
          <label htmlFor={`file-upload-${item._id}`} key={item._id} style={{ cursor: "pointer" }}>
            <div
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
                    B{item.modelNumber}
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
