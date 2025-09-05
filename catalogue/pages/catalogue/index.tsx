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
  return (
    <div style={{ padding: "40px", background: "#fdf6f0", minHeight: "100vh" }}>
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
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "30px",
          justifyItems: "center",
        }}
      >
        {items.map((item) => (
          <div
            key={item._id}
            style={{
              background: "#fffaf5",
              borderRadius: "16px",
              padding: "15px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
              textAlign: "center",
              width: "100%",
              maxWidth: "400px",
              transition: "transform 0.3s",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "250px", // fixed height
                overflow: "hidden",
                borderRadius: "12px",
                marginBottom: "15px",
              }}
            >
              <img
                src={urlFor(item.image).width(400).height(400).url()}
                alt={`Model ${item.modelNumber}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
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
        ))}
      </div>
    </div>
  );
}
