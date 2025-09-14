// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import RouteLoader from "../components/RouteLoader";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.PNG" />

        {/* App logo for mobile devices */}
        <link rel="apple-touch-icon" href="/favicon.PNG" />

        {/* Page title */}
        <title>BLOUDAN JEWELLERY - BANGLES CATALOGUE</title>

        {/* Meta description */}
        <meta
          name="description"
          content="Luxury bangles and jewellery collection"
        />
      </Head>

      {/* Route Loader */}
      <RouteLoader />

      {/* Page Content */}
      <Component {...pageProps} />
    </>
  );
}