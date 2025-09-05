import { GetServerSideProps } from "next";
import { useState } from "react";
import { client } from "../../lib/sanity.client";
import { urlFor } from "../../lib/sanity.image";

interface CatalogueItem {
  _id: string;
  modelNumber: number;
  image: {
    _type: "image";
    asset: { _ref: string; _type: "reference" };
  } | null; // null for blank item
}

interface CatalogueProps {
  items: CatalogueItem[];
}

export const getServerSideProps: GetServerSideProps<CatalogueProps> = async () => {
  const items: CatalogueItem[] = await client.fetch(
    `*[_type == "catalogueItem"] | order(modelNumber asc) {
      _id, modelNumber, image
    }`
  );

  return { props: { items } };
};

export default function Catalogue({ items }: CatalogueProps) {
  const [uploading, setUploading] = useState(false);

  // Add one blank card at the end
  const itemsWithBlank: CatalogueItem[] = [...items, { _id: "blank", modelNumber: 0, image: null }];

  const handleAddNewItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);

    const file = e.target.files[0];

    try {
      // Upload to Sanity
      const data = await client.assets.upload("image", file, { filename: file.name });
      const assetId = data._id; // Sanity asset ID

      // Create new catalogue document
      await fetch("/api/addItem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: assetId }),
      });

      // Reload page to show new item
      window.location.reload();
    } catch (err) {
      console.error(err);
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
          gridTemplateColumns: "repeat(2, 1fr)", // 2 items per row
          gap: "20px",
          justifyItems: "center",
        }}
      >
        {itemsWithBlank.map((item) =>
          item._id === "blank" ? (
            <label htmlFor="file-upload" key="blank">
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
                padding: "15px",
                boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                textAlign: "center",
                width: "100%",
                maxWidth: "350px",
                transition: "transform 0.3s",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "250px",
                  overflow: "hidden",
                  borderRadius: "12px",
                  marginBottom: "15px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "#f5f0eb",
                }}
              >
                <img
                  src={urlFor(item.image!).width(400).url()}
                  alt={`Model ${item.modelNumber}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#7a4c2e",
                }}
              >
                Model #{item.modelNumber}
              </p>
            </div>
          )
        )}
      </div>

      {/* Hidden file input */}
      <input
        id="file-upload"
        type="file"
        style={{ display: "none" }}
        onChange={handleAddNewItem}
      />
    </div>
  );
}
