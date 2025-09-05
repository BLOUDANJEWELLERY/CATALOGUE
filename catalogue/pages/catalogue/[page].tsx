import { client } from "../../lib/sanity.client";
import { urlFor } from "../../lib/sanity.image";

interface CatalogueItem {
  _id: string;
  modelNumber: number;
  image: any;
  description?: string;
}

interface PageProps {
  items: CatalogueItem[];
  page: number;
  totalPages: number;
}

export async function getServerSideProps(context: any) {
  const page = Number(context.params.page) || 1;
  const pageSize = 4;
  const start = (page - 1) * pageSize;

  const totalItems: number = await client.fetch(
    `count(*[_type == "catalogueItem"])`
  );

  const items: CatalogueItem[] = await client.fetch(
    `*[_type == "catalogueItem"] | order(modelNumber asc) [${start}...${start + pageSize}] {
      _id, modelNumber, image, description
    }`
  );

  const totalPages = Math.ceil(totalItems / pageSize);

  return { props: { items, page, totalPages } };
}

export default function CataloguePage({ items, page, totalPages }: PageProps) {
  return (
    <div>
      <h1>Catalogue - Page {page}</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {items.map((item) => (
          <div key={item._id}>
            <img src={urlFor(item.image).width(400).url()} alt={`Model ${item.modelNumber}`} />
            <p>Model #{item.modelNumber}</p>
            {item.description && <p>{item.description}</p>}
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
