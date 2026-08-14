import React, { useState } from 'react'
import MapView from './components/MapView'

export default function App(){
  const [tab, setTab] = useState('Map')
  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand">
          <h1>MushroomRadar</h1>
        </div>
        <nav className="tabs">
          {['Map','Locations','Forecast','Species','Tools'].map(t=> (
            <button key={t} onClick={()=>setTab(t)} className={tab===t? 'active':''}>{t}</button>
          ))}
        </nav>
        <div className="right-actions">
          <div id="source-controls"></div>
        </div>
      </header>
      <main className="map-container">
        {tab==='Map' && <MapView />}
        {tab!=='Map' && (
          <div className="placeholder">
            <h2>{tab}</h2>
            <p>Placeholder area for the <strong>{tab}</strong> tab. I'll add content here as requested.</p>
          </div>
        )}
      </main>
    </div>
  )
}
