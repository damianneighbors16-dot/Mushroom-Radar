import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { scoreHabitat } from '../utils/habitatScorer'
import { SPECIES_PLAYBOOKS } from '../data/species_playbooks'
import { getPrecipLocationData } from '../config'

const defaultCenter = [39.5, -98.35] // center US

export default function MapView(){
  const mapRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [sourceFilter, setSourceFilter] = useState(() => {
    return localStorage.getItem('mush_source') || 'BOTH'
  })

  useEffect(()=>{
    localStorage.setItem('mush_source', sourceFilter)
  },[sourceFilter])

  useEffect(()=>{
    if(mapRef.current) return
    const map = L.map('map', {zoomControl:true}).setView(defaultCenter, 4)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)
    mapRef.current = map
    setMapReady(true)
  },[])

  useEffect(()=>{
    if(!mapReady) return
    // fetch locations on demand (prefers cache/proxy) and add markers
    let mounted = true
    ;(async ()=>{
      // if offline, try to read cached results via getPrecipLocationData()
      const locs = await getPrecipLocationData({source:sourceFilter})
      if(!mounted) return
      addMarkers(locs)
    })()
    return ()=>{ mounted=false }
  },[mapReady, sourceFilter])

  function addMarkers(locs){
    const map = mapRef.current
    if(!map) return
    // clear existing markers layer
    if(map._mushLayer) map.removeLayer(map._mushLayer)
    const layer = L.layerGroup()
    locs.forEach(loc=>{
      const score = scoreHabitat(loc, SPECIES_PLAYBOOKS['Lobster Mushroom'])
      const color = score>=75? 'green' : score>=50? 'orange':'gray'
      const marker = L.circleMarker([loc.lat, loc.lon], {radius:10, color})
      marker.bindPopup(`<b>${loc.name}</b><br/>Score: ${score}`)
      layer.addLayer(marker)
    })
    layer.addTo(map)
    map._mushLayer = layer
  }

  return (
    <div className="map-wrap">
      <div className="map-overlay top-right">
        <div className="source-buttons">
          <button onClick={()=>setSourceFilter('NEW')} className={sourceFilter==='NEW'? 'active':''}>NEW</button>
          <button onClick={()=>setSourceFilter('OLD')} className={sourceFilter==='OLD'? 'active':''}>OLD</button>
          <button onClick={()=>setSourceFilter('BOTH')} className={sourceFilter==='BOTH'? 'active':''}>BOTH</button>
        </div>
      </div>
      <div id="map" className="map" />
    </div>
  )
}
