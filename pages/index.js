import Head from 'next/head'
import PubNub from 'pubnub';
import { PubNubProvider } from 'pubnub-react';
import { parseCookies, setCookie } from "nookies";
import { ToastProvider } from 'react-toast-notifications';

import App from '../components/App';
import {getUuid} from '../utils/UUID';

import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react';
export default function Home({cookies}) {
  // console.log({cookies});
  const [pubnub, setPubnub] = useState();
  useEffect(() => {
    setPubnub(new PubNub({
      publishKey: 'pub-c-e87aa73d-3d6a-406f-88fb-54ce6270d019',
      subscribeKey: 'sub-c-6aea92d4-e3b3-11eb-a999-22f598fbfd18',
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
        <script src="/sw-push-listener.js"></script>
      </Head>
      {
        pubnub ?
        <PubNubProvider client={pubnub}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </PubNubProvider>
        : null
      }
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