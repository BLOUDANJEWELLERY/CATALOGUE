import { GetServerSideProps } from "next";
import { client } from "../../lib/sanity.client";
import { urlFor } from "../../lib/sanity.image";

interface CatalogueItem {
  _id: string;
  modelNumber: number;
  image: {
    _type: "image";
    asset: { _ref: string; _type: "reference" };
  };
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
  // Add one blank card at the end
  const itemsWithBlank = [...items, { _id: "blank", modelNumber: 0, image: null }];

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
          gridTemplateColumns: "repeat(2, 1fr)", // exactly 2 per row
          gap: "20px",
          justifyItems: "center",
        }}
      >
        {itemsWithBlank.map((item) =>
          item._id === "blank" ? (
            <div
              key="blank"
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
              + Add New Item
            </div>
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
                  height: "250px", // fixed container
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
                  src={urlFor(item.image).width(400).url()}
                  alt={`Model ${item.modelNumber}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain", // fit without cropping
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
    </div>
  );
}
