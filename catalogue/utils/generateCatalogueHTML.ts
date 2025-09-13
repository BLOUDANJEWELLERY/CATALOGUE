import { urlFor, SanityImage } from '../lib/sanity.image'; // adjust path

export function generateCatalogueHTML(
  items: any[],
  filter: "Adult" | "Kids" | "Both"
) {
  const filteredItems = items.filter(item => {
    if (filter === "Adult") return item.sizes?.includes("Adult");
    if (filter === "Kids") return item.sizes?.includes("Kids");
    if (filter === "Both") return item.sizes?.includes("Adult") || item.sizes?.includes("Kids");
    return false;
  });

  return `
    <html>
      <head>
        <style>
          @page { margin: 0; }
          body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
          .header, .footer {
            width: 100%;
            background: #c7a332;
            color: #0b1a3d;
            text-align: center;
            padding: 6px 0;
          }
          .header div, .footer div { margin: 2px 0; }
          .container {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            padding: 10px;
            page-break-inside: avoid;
            box-sizing: border-box;
            min-height: calc(297mm - 40mm); /* A4 minus header/footer approx */
          }
          .card {
            width: 90mm;
            height: 110mm;
            border: 2px solid #c7a332;
            border-radius: 14px;
            margin: 5mm;
            padding: 4mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            page-break-inside: avoid;
          }
          .card img {
            max-height: 55%;
            object-fit: contain;
            border-radius: 8px;
          }
          .model {
            color: #c7a332;
            font-weight: 900;
            font-size: 28px;
            margin: 4px 0 2px 0;
            text-align: center;
          }
          .weights {
            display: flex;
            justify-content: space-between;
            width: 80%;
            font-weight: 500;
            color: #0b1a3d;
            font-size: 14px;
          }
          /* Force footer at bottom of each page */
          .footer {
            position: fixed;
            bottom: 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>BLOUDAN JEWELLERY</div>
          <div>BANGLES CATALOGUE</div>
        </div>

        <div class="container">
          ${filteredItems.map((item, index) => {
            const showAdult = filter !== "Kids" && item.sizes?.includes("Adult");
            const showKids = filter !== "Adult" && item.sizes?.includes("Kids");
            let weightsHTML = '';
            if (showAdult && showKids) {
              weightsHTML = `<div class="weights">
                <span>Adult - ${item.weightAdult}g</span>
                <span>Kids - ${item.weightKids}g</span>
              </div>`;
            } else if (showAdult) {
              weightsHTML = `<div class="weights" style="justify-content:center;">
                <span>Adult - ${item.weightAdult}g</span>
              </div>`;
            } else if (showKids) {
              weightsHTML = `<div class="weights" style="justify-content:center;">
                <span>Kids - ${item.weightKids}g</span>
              </div>`;
            }

            const imgUrl = item.image 
              ? urlFor(item.image as SanityImage).width(1000).auto("format").url() 
              : '';

            return `
              <div class="card">
                <img src="${imgUrl}" />
                <div class="model">B${item.modelNumber}</div>
                ${weightsHTML}
              </div>
            `;
          }).join('')}
        </div>

        <div class="footer">
          <div>BLOUDAN JEWELLERY</div>
          <div>BANGLES CATALOGUE</div>
          <div>Page 1</div>
        </div>
      </body>
    </html>
  `;
}