import Head from 'next/head'
import PubNub from 'pubnub';
import { PubNubProvider } from 'pubnub-react';
import { v4 as uuid_v4 } from "uuid";

import App from '../components/App'

import styles from '../styles/Home.module.css'

const pubnub = new PubNub({
  publishKey: 'pub-c-e87aa73d-3d6a-406f-88fb-54ce6270d019',
  subscribeKey: 'sub-c-6aea92d4-e3b3-11eb-a999-22f598fbfd18',
  uuid: uuid_v4(),
});

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Colorizer &mdash; Colorful Music Visualizer</title>
        <meta name="description" content="Colorful Visualizer based on Mic Input" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PubNubProvider client={pubnub}>
        <App />
      </PubNubProvider>
    </div>
  )
}
