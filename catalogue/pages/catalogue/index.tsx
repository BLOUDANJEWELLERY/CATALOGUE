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

export const getServerSideProps: GetServerSideProps<CatalogueProps> =
  async () => {
    const items: CatalogueItem[] = await client.fetch(
      `*[_type == "catalogueItem"] | order(modelNumber asc) { _id, modelNumber, image }`
    );
    return { props: { items } };
  };

export default function Catalogue({ items }: CatalogueProps) {
  const [uploading, setUploading] = useState(false);

  const itemsWithBlank: CatalogueItem[] = [
    ...items,
    { _id: "blank", modelNumber: 0, image: null },
  ];

  const handleAddNewItem = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Upload image
      const uploadRes = await fetch("/api/catalogue/uploadImage", {
        method: "POST",
        body: formData,
      });
      const uploadData: { assetId: string; assetUrl?: string; error?: string } =
        await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      // Create catalogue item
      const createRes = await fetch("/api/catalogue/addItem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: uploadData.assetId }),
      });
      const createData: { success?: true; doc?: CatalogueItem; error?: string } =
        await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Failed to create item");

      window.location.reload();
    } catch (error) {
      console.error("Failed to add item:", error);
      setUploading(false);
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
        {itemsWithBlank.map((item) =>
          item._id === "blank" ? (
            <label htmlFor="file-upload" key="item._id">
              <div
                style={{
                  background: "#fffaf5",
                  borderRadius: "16px",
                  padding: "40px 20px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                  textAlign: "center",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "1.2rem",
                  color: "#7a4c2e",
                  fontWeight: 600,
                  minHeight: "250px",
                }}
              >
                {uploading ? "Uploading..." : "+ Add New Item"}
              </div>
            </label>
          ) : (
            <div
              key={item._id}
              style={{
                background: "#fffaf5",
                borderRadius: "16px",
                padding: "10px",
                boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                textAlign: "center",
                transition: "transform 0.3s",
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
            </div>
          )
        )}
      </div>

      <input
        id="file-upload"
        type="file"
        style={{ display: "none" }}
        onChange={handleAddNewItem}
      />
    </div>
  );
}
