import './_group.css'
import Header from './_shared/Header'
import MarketClient from './_shared/MarketClient'

export function Current() {
  return <div className="min-h-screen bg-surface text-on-surface">
    <Header lang="en" />
    <main className="pt-20">
      <MarketClient lang="en" rows={[]} conditions={[]} monitor={{ loggedIn: false, level: 'empty', unsafe: 0, items: 0, rows: [] }} />
    </main>
  </div>
}
