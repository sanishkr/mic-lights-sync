import Head from 'next/head'
import App from '../components/App'

import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Colorizer &mdash; Colorful Music Visualizer</title>
        <meta name="description" content="Colorful Visualizer based on Mic Input" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <App />
    </div>
  )
}
