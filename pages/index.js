import { useEffect, useState } from 'react';
import Head from 'next/head'
import Script from 'next/script'
import PubNub from 'pubnub';
import { PubNubProvider } from 'pubnub-react';
import { parseCookies, setCookie } from "nookies";
import { Toaster } from 'react-hot-toast';

import App from '../components/App';
import {getUuid} from '../utils/UUID';

import styles from '../styles/Home.module.css'
export default function Home({cookies}) {
  // console.log({cookies});
  const [pubnub, setPubnub] = useState();
  useEffect(() => {
    // console.log(process.env.NEXT_PUBLIC_publishKey);
    setPubnub(new PubNub({
      publishKey: process.env.NEXT_PUBLIC_publishKey,
      subscribeKey: process.env.NEXT_PUBLIC_subscribeKey,
      uuid: getUuid(),
    }));
  }, [])
  return (
    <div className={styles.container}>
      <Head>
        <title>Colorizer &mdash; Colorful Music Visualizer</title>
        <meta name="description" content="Colorful Visualizer based on Mic Input" />

        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />

        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192"  href="/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="google-site-verification" content="2QRp4-sDh7-L296IkIgi4QMwZUyopqxLdT-TRtSwcdw" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        {
          pubnub ?
          <PubNubProvider client={pubnub}>
            <App />
          </PubNubProvider>
          : null
        }
        <Toaster/>
      <Script src="/sw-push-listener.js"></Script>
    </div>
  )
}

Home.getInitialProps = async function(ctx) {
  // Parse
  const cookies = parseCookies(ctx);

  // Set
  // setCookie(ctx, "fromGetInitialProps", "value", {
  //   maxAge: 30 * 24 * 60 * 60,
  //   path: "/"
  // });

  // Destroy
  // destroyCookie(ctx, "token");

  return { cookies };
};
