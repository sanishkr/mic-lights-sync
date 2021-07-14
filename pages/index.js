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
        <link rel="icon" href="/favicon.ico" />
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