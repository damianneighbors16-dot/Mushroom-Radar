const express = require('express')
const axios = require('axios')
const NodeCache = require('node-cache')
const cors = require('cors')

const app = express()
const cache = new NodeCache({ stdTTL: 60 * 5 }) // cache 5 minutes
app.use(cors())
app.use(express.json())

const PRECIP_API = process.env.PRECIP_API_URL || 'https://api.precip.ai' // adjust if needed
const PRECIP_KEY = process.env.PRECIP_API_KEY || ''

// Simple proxy for Precip.ai endpoints. Pass through query params.
app.get('/api/precip', async (req, res) => {
  try{
    const q = req.query
    const cacheKey = 'precip:' + JSON.stringify(q)
    const cached = cache.get(cacheKey)
    if(cached) return res.json(cached)

    if(!PRECIP_KEY){
      // For safety, don't attempt to call upstream without an API key.
      return res.status(400).json({ error: 'No PRECIP_API_KEY configured on server.' })
    }

    // Example: proxy to a hypothetical Precip endpoint. Update path as needed.
    const upstreamUrl = `${PRECIP_API}/v1/locations`
    const resp = await axios.get(upstreamUrl, {
      params: q,
      headers: { 'Authorization': `Bearer ${PRECIP_KEY}` }
    })
    cache.set(cacheKey, resp.data)
    res.json(resp.data)
  }catch(err){
    console.error('proxy error', err.message)
    res.status(500).json({ error: 'Proxy error', detail: err.message })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, ()=> console.log(`Server proxy listening on ${PORT}`))
