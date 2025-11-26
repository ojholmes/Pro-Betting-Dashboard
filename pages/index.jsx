import Head from 'next/head'
import Dashboard from '../components/Dashboard'

export default function Home() {
  return (
    <>
      <Head>
        <title>Pro Betting Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="page-root">
        <header className="header">
          <h1>Pro Betting Dashboard</h1>
          <p>Maximize returns using algorithmic staking and AI insights.</p>
        </header>

        <div className="grid">
          <div className="card">
            <Dashboard />
          </div>
        </div>
      </main>
    </>
  )
}
