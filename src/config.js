// Configuration + helper to fetch Precip-like location data via local proxy.
// To enable real Precip.ai calls:
// 1) Run `server/server.js` with env PRECIP_API_KEY and PRECIP_API_URL if needed.
// 2) The client calls `/api/precip` which the server proxies to Precip.ai.

const MOCK_LOCS = [
  { id:1, name:"Willow Divide Ridge", lat:39.7, lon:-105.2, soilTemp2:62, soilTemp4:58, soilTemp8:55, soilMoisture:18, rainLast7d:0.42, elevation:10780, slope:12, aspect:220, canopy:'Moderate', forestType:'Conifer' },
  { id:2, name:"McPhee Reservoir Area", lat:37.5, lon:-108.2, soilTemp2:60, soilTemp4:56, soilTemp8:53, soilMoisture:25, rainLast7d:0.12, elevation:6800, slope:8, aspect:150, canopy:'Open', forestType:'Mixed' },
  { id:3, name:"El Diente Foothills", lat:37.3, lon:-107.8, soilTemp2:59, soilTemp4:55, soilTemp8:52, soilMoisture:28, rainLast7d:0.9, elevation:6100, slope:6, aspect:190, canopy:'Dense', forestType:'Deciduous' }
]

// Simple client-side cache using localStorage. Keyed by URL and TTL.
function cacheGet(key){
  try{
    const s = localStorage.getItem(key)
    if(!s) return null
    const obj = JSON.parse(s)
    if(Date.now() > obj.expiry) { localStorage.removeItem(key); return null }
    return obj.data
  }catch(e){ return null }
}
function cacheSet(key, data, ttl=1000*60*5){
  try{ localStorage.setItem(key, JSON.stringify({data, expiry: Date.now()+ttl})) }catch(e){}
}

export async function getPrecipLocationData({source='BOTH', lat, lon} = {}){
  // If server proxy is available, request it. Otherwise return mock data.
  const q = { source, lat, lon }
  const qs = new URLSearchParams(Object.entries(q).filter(([,v])=>v!==undefined)).toString()
  const url = `/api/precip?${qs}`
  const cacheKey = `precip:${qs || source}`

  // prefer cached
  const cached = cacheGet(cacheKey)
  if(cached) return cached

  try{
    const resp = await fetch(url)
    if(resp.ok){
      const data = await resp.json()
      // expect array of locations; if upstream returns different shape, adapt here
      if(Array.isArray(data) && data.length>0){ cacheSet(cacheKey, data); return data }
      // fallback: if server returns message about missing key, fall through to mock
    }
  }catch(err){
    // network error or proxy not running
  }

  // fallback to mock data and cache it
  const mock = MOCK_LOCS.map(l=> ({...l, source}))
  cacheSet(cacheKey, mock)
  return mock
}

export const PRECIP_API_HINT = `Run server/server.js with PRECIP_API_KEY to enable real Precip.ai proxy at /api/precip. Client caches responses in localStorage.`
