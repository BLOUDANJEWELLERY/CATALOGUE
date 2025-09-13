// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.PNG" />

        {/* Optional: App logo for mobile devices */}
        <link rel="apple-touch-icon" href="/favicon.PNG" />

        {/* Optional: Page title */}
        <title>BLOUDAN JEWELLERY - BANGLES CATALOGUE</title>

        {/* Optional: Meta description */}
        <meta name="description" content="Luxury bangles and jewellery collection" />
      </Head>

      <Component {...pageProps} />
    </>
  );
}