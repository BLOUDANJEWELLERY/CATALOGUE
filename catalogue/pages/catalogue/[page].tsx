import { GetServerSideProps } from "next";
import { client } from "../../lib/sanity.client";
import { urlFor } from "../../lib/sanity.image";

// Strongly typed catalogue item
interface CatalogueItem {
  _id: string;
  modelNumber: number;
  image: {
    _type: "image";
    asset: {
      _ref: string;
      _type: "reference";
    };
  };
}

interface PageProps {
  items: CatalogueItem[];
  page: number;
  totalPages: number;
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const page = Number(context.params?.page) || 1;
  const pageSize = 4;
  const start = (page - 1) * pageSize;

  // Total items for pagination
  const totalItems: number = await client.fetch(
    `count(*[_type == "catalogueItem"])`
  );

  // Fetch items for this page
  const items: CatalogueItem[] = await client.fetch(
    `*[_type == "catalogueItem"] | order(modelNumber asc) [${start}...${start + pageSize}] {
      _id, modelNumber, image
    }`
  );

  const totalPages = Math.ceil(totalItems / pageSize);

  return { props: { items, page, totalPages } };
};

export default function CataloguePage({ items, page, totalPages }: PageProps) {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Catalogue - Page {page}</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
        {items.map((item) => (
          <div key={item._id} style={{ border: "1px solid #ccc", padding: "10px" }}>
            <img
              src={urlFor(item.image).width(400).url()}
              alt={`Model ${item.modelNumber}`}
              style={{ width: "100%" }}
            />
            <p>Model #{item.modelNumber}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px" }}>
        {Array.from({ length: totalPages }, (_, i) => (
          <a key={i} href={`/catalogue/${i + 1}`} style={{ margin: "0 5px" }}>
            {i + 1}
          </a>
        ))}
      </div>
    </div>
  );
}
