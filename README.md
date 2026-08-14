# MushroomRadar (scaffold)

This repository is a minimal scaffold for the MushroomRadar app. It includes:

- A small React + Vite app with Leaflet map
- Three data-source filters: NEW, OLD, BOTH
- Example habitat scoring logic and a species playbook
- Mock Precip-like data and instructions to wire a real Precip.ai API key
- Offline caching and localStorage usage for selected source

Quick start

1. Install dependencies:

```bash
cd mushroomradar
npm install
```

2. Run dev server:

```bash
npm run dev
```

3. Build:

```bash
npm run build
```

GitHub setup

I can't create the GitHub repository for you from here. To publish:

```bash
# create repo locally and push
git init
git add .
git commit -m "Initial scaffold for MushroomRadar"
# create a repo on GitHub named MushroomRadar, then:
git remote add origin git@github.com:YOUR_USERNAME/MushroomRadar.git
git branch -M main
git push -u origin main
```

Wire Precip.ai data

- Edit `src/config.js` and implement `getPrecipLocationData()` to call the Precip.ai endpoints with your API key.
- The UI currently uses mock data so you can run it without credits. When you wire the real API, add caching and rate limits as needed.

Server proxy and caching

- A simple proxy server is included at `server/server.js`. Run it with `PRECIP_API_KEY` set to proxy requests to Precip.ai:

```bash
cd server
npm install
# export PRECIP_API_KEY=your_key_here (Windows: set PRECIP_API_KEY=...)
npm start
```

- The client will call `/api/precip` (see `src/config.js`) and cache responses in `localStorage` to reduce API credit usage.

About using upstream files

- You requested using files from `https://github.com/damianneighbors16-dot/Mushroom-Radar`. I can't fetch remote files from here automatically. If you want me to incorporate those files, either grant access or paste the files. Do NOT include any files that implement or route through base44 — I will skip any files containing base44 or related routing.

Notes about credits and usage

- The scaffold uses mock data; you will only incur API calls after wiring Precip.ai. Keep requests minimal; cache location responses and only request detailed layers when zoomed or on-demand.

If you want I can:
- Add a backend proxy to safely store the API key
- Wire real Precip.ai calls and caching logic
- Create the GitHub repo for you if you connect the integration

