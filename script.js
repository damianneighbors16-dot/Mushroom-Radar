const zones = [
  { name: "San Juan high country", coords: [37.793, -107.858], radius: 14500, probability: 86, species: ["King bolete", "Chanterelle", "Hedgehog mushroom"], elevation: "9,000–11,100 ft", habitat: "Spruce-fir & aspen edges", conditions: "Cool nights; recent monsoon moisture" },
  { name: "Dolores River corridor", coords: [37.487, -108.482], radius: 8500, probability: 64, species: ["Oyster mushroom", "Aspen bolete", "Morel"], elevation: "7,100–8,400 ft", habitat: "Riparian cottonwood & mixed conifer", conditions: "Good moisture near shaded drainages" },
  { name: "Cortez foothills", coords: [37.349, -108.655], radius: 7600, probability: 28, species: ["Shaggy mane", "Agaricus"], elevation: "6,100–7,100 ft", habitat: "Pinyon-juniper & grassland", conditions: "Warm and comparatively dry" },
  { name: "Lizard Head Pass", coords: [37.881, -107.924], radius: 6200, probability: 78, species: ["Hedgehog mushroom", "King bolete", "Chanterelle"], elevation: "10,000–10,600 ft", habitat: "Mixed spruce-fir forest", conditions: "Moist duff and afternoon showers" },
  { name: "Mesa Verde uplands", coords: [37.242, -108.489], radius: 6000, probability: 42, species: ["Shaggy mane", "Agaricus", "Puffball"], elevation: "6,800–7,600 ft", habitat: "Pinyon-juniper woodland", conditions: "Watch for rain after warm spells" },
  { name: "Rico–Priest Gulch", coords: [37.693, -108.033], radius: 7800, probability: 72, species: ["Morel", "Oyster mushroom", "King bolete"], elevation: "8,300–9,900 ft", habitat: "Aspen groves & mixed conifer", conditions: "Good shade and lingering soil moisture" }
];

const speciesProfiles = [
  { name: "King bolete", latin: "Boletus edulis group", season: "Mid-summer to early fall after steady moisture", elevation: "About 8,000–11,000 ft", aspect: "Cool, shaded north/east aspects often hold moisture longer; aspect is only a clue", habitat: "Mature spruce-fir, mixed conifer, or aspen-conifer edges", soil: "Well-drained forest soil with deep needle/leaf litter", temperature: "Often fruits after warm days and cool, nonfreezing nights", moisture: "Moist soil after repeated rain; avoid waterlogged spots", warning: "Many boletes are not edible and some cause illness. Pore color, staining, odor, and all features require expert review." },
  { name: "Chanterelle", latin: "Cantharellus species", season: "Summer through early fall, often after seasonal rains", elevation: "Commonly mid to high elevation in suitable forest", aspect: "North/east slopes can stay cooler and damper; not a rule", habitat: "Forest floor with compatible trees; species and tree partners vary regionally", soil: "Organic-rich forest duff, not bare mineral soil", temperature: "Mild, humid periods after rain", moisture: "Consistently damp, not flooded", warning: "False chanterelles and jack-o'-lantern look-alikes exist. Do not use color alone or eat without expert confirmation." },
  { name: "Morel", latin: "Morchella species", season: "Spring to early summer; some high-elevation burn morels appear after fire", elevation: "Varies widely by morel species and disturbance", aspect: "Cooler north/east aspects may extend moisture in some sites", habitat: "Forest edges, disturbed ground, and sometimes recent burns; tree and fire associations vary", soil: "Moist, warming soil with leaf litter or ash depending on type", temperature: "Fruiting often follows warming spring soil and moisture", moisture: "Damp soil following snowmelt or rain", warning: "False morels can be seriously toxic. A hollow interior and true morel structure must be confirmed by an expert." },
  { name: "Oyster mushroom", latin: "Pleurotus species", season: "Spring through fall after moisture", elevation: "Broad range where host wood occurs", aspect: "Shaded, humid draws and north/east sides preserve damp wood", habitat: "Dead or dying hardwood; species vary by host and region", soil: "Grows from wood, not soil", temperature: "Cool to mild weather is favorable", moisture: "Damp decaying wood and humid air", warning: "Wood-growing look-alikes can be dangerous. Spore print, gills, wood host, and expert confirmation matter." },
  { name: "Hedgehog mushroom", latin: "Hydnum species", season: "Late summer through fall", elevation: "Often mountain forest elevations", aspect: "Shady north/east forest aspects can be favorable", habitat: "Mixed conifer and hardwood forest floor", soil: "Moist humus and forest duff", temperature: "Cool, moist late-summer conditions", moisture: "Steady rain with shaded ground", warning: "Common names cover multiple species. Confirm the tooth-like underside and all traits with an expert." },
  { name: "Shaggy mane", latin: "Coprinus comatus", season: "Spring through fall, frequently after rain", elevation: "Broad range", aspect: "Aspect is usually less important than rich disturbed ground and rain", habitat: "Lawns, paths, field edges, and disturbed soil", soil: "Nutrient-rich disturbed soil", temperature: "Mild weather after rain", moisture: "Freshly wet soil", warning: "Do not confuse with other inky caps. Specimens deteriorate quickly; identification and food safety need expert guidance." },
  { name: "Puffball", latin: "Calvatia and related genera", season: "Summer through fall after rain", elevation: "Broad range", aspect: "Moist north/east ground may fruit longer, but open grassland species vary", habitat: "Grassland, woodland edges, or forest openings depending on species", soil: "Often well-drained soil with organic matter", temperature: "Mild to warm periods after rain", moisture: "Rain followed by moderate warmth", warning: "Young deadly Amanita mushrooms can resemble puffballs. Cut every specimen vertically; get expert verification." },
  { name: "Agaricus", latin: "Agaricus species", season: "Summer through fall, often after rain", elevation: "Broad range", aspect: "Moist shaded sites can help, but habitat matters more", habitat: "Grass, woodland edge, and disturbed ground depending on species", soil: "Often humus-rich grassland or forest-edge soil", temperature: "Mild, moist weather", moisture: "Rain followed by several mild days", warning: "This genus includes edible and poisonous species. Yellow-staining and phenol odors are red flags, but expert ID is essential." }
];

const map = L.map("map", { zoomControl: false }).setView([37.64, -108.12], 8);
L.control.zoom({ position: "bottomright" }).addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap contributors" }).addTo(map);
const terrainLayers = {
  slope: L.tileLayer.wms("https://elevation.nationalmap.gov/arcgis/services/3DEPElevation/ImageServer/WMSServer", { layers: "Slope Map", format: "image/png", transparent: true, opacity: .5 }),
  aspect: L.tileLayer.wms("https://elevation.nationalmap.gov/arcgis/services/3DEPElevation/ImageServer/WMSServer", { layers: "Aspect Map", format: "image/png", transparent: true, opacity: .52 }),
  hillshade: L.tileLayer.wms("https://elevation.nationalmap.gov/arcgis/services/3DEPElevation/ImageServer/WMSServer", { layers: "Hillshade Multidirectional", format: "image/png", transparent: true, opacity: .5 })
};
const sightingsLayer = L.layerGroup();
let sightingsLoaded = false;

const colorFor = probability => probability >= 75 ? "#2c9b62" : probability >= 40 ? "#e7ae2c" : "#d85a4d";
const details = { name: document.querySelector("#zone-name"), probability: document.querySelector("#zone-probability"), info: document.querySelector("#zone-info") };
const layers = [];

function selectZone(zone, layer) {
  details.name.textContent = zone.name;
  details.probability.textContent = `${zone.probability}% estimated fruiting chance`;
  details.probability.style.color = colorFor(zone.probability);
  details.info.innerHTML = `
    <div><dt>Species</dt><dd>${zone.species.join(", ")}</dd></div>
    <div><dt>Elevation</dt><dd>${zone.elevation}</dd></div>
    <div><dt>Habitat</dt><dd>${zone.habitat}</dd></div>
    <div><dt>Conditions</dt><dd>${zone.conditions}</dd></div>`;
  if (layer) layer.openPopup();
}

zones.forEach(zone => {
  const color = colorFor(zone.probability);
  const layer = L.circle(zone.coords, { radius: zone.radius, color, fillColor: color, fillOpacity: .28, weight: 2 }).addTo(map);
  layer.bindPopup(`<h3 class="popup-title">${zone.name}</h3><p class="popup-copy"><strong>${zone.probability}% chance</strong><br>${zone.species.join(", ")}</p>`);
  layer.on("click", () => selectZone(zone, layer));
  layers.push({ zone, layer });
});

document.querySelector("#mushroom-query").addEventListener("input", event => {
  const query = event.target.value.trim().toLowerCase();
  const matches = layers.filter(({ zone }) => zone.species.some(species => species.toLowerCase().includes(query)));
  layers.forEach(({ layer }) => layer.setStyle({ opacity: 0, fillOpacity: 0 }));
  matches.forEach(({ layer }) => layer.setStyle({ opacity: 1, fillOpacity: .28 }));
  renderSpeciesGuide(query);
  document.querySelector("#search-result").textContent = query ? `${matches.length} zone${matches.length === 1 ? "" : "s"} match “${event.target.value.trim()}”.` : "Showing all forecast zones.";
});

function renderSpeciesGuide(query = "") {
  const profiles = speciesProfiles.filter(profile => profile.name.toLowerCase().includes(query));
  document.querySelector("#species-guide-list").innerHTML = profiles.map(profile => `<article class="species-card"><h4>${profile.name}</h4><p class="latin">${profile.latin}</p><div class="species-grid"><div><span>Season</span><strong>${profile.season}</strong></div><div><span>Elevation</span><strong>${profile.elevation}</strong></div><div><span>Slope / aspect</span><strong>${profile.aspect}</strong></div><div><span>Habitat</span><strong>${profile.habitat}</strong></div><div><span>Soil / substrate</span><strong>${profile.soil}</strong></div><div><span>Temperature</span><strong>${profile.temperature}</strong></div><div><span>Moisture</span><strong>${profile.moisture}</strong></div></div><p class="species-warning"><strong>Safety:</strong> ${profile.warning}</p></article>`).join("") || "<p class=\"search-result\">No guide entry yet. Try one of the mushroom names on the map.</p>";
}

function renderBestSpots() {
  const list = document.querySelector("#best-spots-list");
  list.innerHTML = [...layers].sort((a, b) => b.zone.probability - a.zone.probability).slice(0, 5).map(({ zone, layer }) => `<li data-zone="${zone.name}"><div><strong>${zone.name}</strong><small>${zone.species[0]} · ${zone.elevation}</small></div><span>${zone.probability}%</span></li>`).join("");
  list.querySelectorAll("li").forEach(item => item.addEventListener("click", () => {
    const selected = layers.find(({ zone }) => zone.name === item.dataset.zone);
    map.flyTo(selected.zone.coords, 11); selectZone(selected.zone, selected.layer);
  }));
}

document.querySelector("#locate-button").addEventListener("click", () => {
  const status = document.querySelector("#map-status");
  if (!navigator.geolocation) { status.textContent = "Location services are not available in this browser."; return; }
  status.textContent = "Finding your location…";
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => { const point = [coords.latitude, coords.longitude]; L.marker(point).addTo(map).bindPopup("Your approximate location").openPopup(); map.setView(point, 11); status.textContent = ""; },
    () => { status.textContent = "We couldn’t access your location. Check your browser permission and try again."; },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

selectZone(zones[0]);
renderSpeciesGuide();
renderBestSpots();

async function loadSightings() {
  if (sightingsLoaded) { map.addLayer(sightingsLayer); return; }
  const status = document.querySelector("#map-status");
  status.textContent = "Loading recent public fungus observations…";
  try {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const url = `https://api.inaturalist.org/v1/observations?taxon_id=47170&swlat=37.05&swlng=-109.05&nelat=38.2&nelng=-107.35&d1=${start}&d2=${end}&per_page=100&order=desc&order_by=observed_on`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Sightings unavailable");
    const data = await response.json();
    data.results.filter(item => item.geojson?.coordinates).forEach(item => {
      const [lng, lat] = item.geojson.coordinates;
      const title = item.taxon?.preferred_common_name || item.species_guess || "Fungus observation";
      const marker = L.circleMarker([lat, lng], { radius: 5, color: "#6b3a72", fillColor: "#a96ab1", fillOpacity: .8, weight: 1 });
      marker.bindPopup(`<h3 class="popup-title">${title}</h3><p class="popup-copy">Observed ${item.observed_on_string || "date not listed"}<br><a href="https://www.inaturalist.org/observations/${item.id}" target="_blank" rel="noopener">View public observation</a></p>`);
      sightingsLayer.addLayer(marker);
    });
    sightingsLoaded = true; map.addLayer(sightingsLayer); status.textContent = "Recent public sightings shown in purple.";
  } catch { status.textContent = "Public sightings are temporarily unavailable."; }
}

document.querySelectorAll(".map-tools button").forEach(button => button.addEventListener("click", () => {
  const name = button.dataset.layer;
  if (name === "sightings") {
    if (map.hasLayer(sightingsLayer)) { map.removeLayer(sightingsLayer); button.classList.remove("active"); }
    else { loadSightings(); button.classList.add("active"); }
    return;
  }
  const layer = terrainLayers[name];
  if (map.hasLayer(layer)) { map.removeLayer(layer); button.classList.remove("active"); }
  else { map.addLayer(layer); button.classList.add("active"); }
}));

const journalKey = "mushroom-radar-journal";
function getJournal() { try { return JSON.parse(localStorage.getItem(journalKey)) || []; } catch { return []; } }
function renderJournal() {
  const entries = getJournal();
  document.querySelector("#journal-list").innerHTML = entries.slice(0, 8).map(entry => `<div class="journal-entry"><strong>${entry.species} · ${entry.place}</strong>${entry.notes || "No notes"}<br><small>${entry.date}</small></div>`).join("") || "<p class=\"search-result\">No private notes yet. Your notes stay in this browser.</p>";
}
document.querySelector("#find-form").addEventListener("submit", event => {
  event.preventDefault();
  const entries = getJournal();
  entries.unshift({ species: document.querySelector("#find-species").value.trim(), place: document.querySelector("#find-place").value.trim(), notes: document.querySelector("#find-notes").value.trim(), date: new Date().toLocaleDateString() });
  localStorage.setItem(journalKey, JSON.stringify(entries.slice(0, 50)));
  event.target.reset(); renderJournal();
});
renderJournal();

document.querySelector("#mushroom-photo").addEventListener("change", event => {
  const output = document.querySelector("#photo-help");
  output.textContent = event.target.files[0] ? `Photo selected: ${event.target.files[0].name}. For safe expert review, also capture cap, underside, full stem base, and nearby trees/substrate. Do not eat based on this app or a photo.` : "Take clear photos of the cap, underside, stem base, and surrounding habitat.";
});

const alertSelect = document.querySelector("#alert-species");
speciesProfiles.forEach(profile => alertSelect.insertAdjacentHTML("beforeend", `<option>${profile.name}</option>`));
const savedAlert = JSON.parse(localStorage.getItem("mushroom-radar-alert") || "null");
if (savedAlert) { alertSelect.value = savedAlert.species; document.querySelector("#alert-threshold").value = savedAlert.threshold; document.querySelector("#alert-status").textContent = `${savedAlert.species} reminder saved for ${savedAlert.threshold}% activity.`; }
document.querySelector("#alert-form").addEventListener("submit", async event => {
  event.preventDefault();
  const alert = { species: alertSelect.value, threshold: Number(document.querySelector("#alert-threshold").value) };
  localStorage.setItem("mushroom-radar-alert", JSON.stringify(alert));
  if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
  document.querySelector("#alert-status").textContent = `${alert.species} reminder saved for ${alert.threshold}% activity in this browser.`;
});

const celsiusToFahrenheit = value => value == null ? null : (value * 9 / 5) + 32;
const mean = values => values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
async function inBatches(items, task, batchSize = 6) {
  const results = [];
  for (let index = 0; index < items.length; index += batchSize) {
    results.push(...await Promise.all(items.slice(index, index + batchSize).map(task)));
  }
  return results;
}
const displayReading = observation => {
  const temp = celsiusToFahrenheit(observation.properties.temperature?.value);
  const humidity = observation.properties.relativeHumidity?.value;
  const parts = [];
  if (temp != null) parts.push(`${Math.round(temp)}°F`);
  if (humidity != null) parts.push(`${Math.round(humidity)}% RH`);
  return parts.join(" · ") || "No current reading";
};

function renderOutlook(periods) {
  const outlook = document.querySelector("#weather-outlook");
  const daytimePeriods = periods.filter(period => period.isDaytime).slice(0, 7);
  outlook.innerHTML = daytimePeriods.map(period => {
    const day = new Date(period.startTime).toLocaleDateString([], { weekday: "short" });
    const rain = Number.parseInt(period.probabilityOfPrecipitation?.value ?? 0, 10) || 0;
    return `<div class="weather-day" title="${period.shortForecast}; wind ${period.windSpeed}"><strong>${day}</strong><span>${period.temperature}°${period.temperatureUnit}</span><small>🌧 ${rain}%</small></div>`;
  }).join("");
}

async function loadWeather() {
  const status = document.querySelector("#weather-status");
  const stationList = document.querySelector("#weather-stations");
  const refresh = document.querySelector("#refresh-weather");
  refresh.disabled = true;
  status.textContent = "Finding all NOAA/NWS stations linked to the six forecast areas…";
  stationList.innerHTML = "";
  try {
    const points = await Promise.all(zones.map(async zone => {
      const response = await fetch(`https://api.weather.gov/points/${zone.coords[0]},${zone.coords[1]}`, { headers: { Accept: "application/geo+json" } });
      if (!response.ok) throw new Error("Point lookup failed");
      return response.json();
    }));
    const stationCollections = await Promise.all(points.map(async point => {
      const response = await fetch(point.properties.observationStations, { headers: { Accept: "application/geo+json" } });
      if (!response.ok) throw new Error("Station list failed");
      return (await response.json()).features;
    }));
    const forecastResponse = await fetch(points[0].properties.forecast, { headers: { Accept: "application/geo+json" } });
    if (forecastResponse.ok) renderOutlook((await forecastResponse.json()).properties.periods);
    const stationsById = new Map();
    stationCollections.flat().forEach(station => stationsById.set(station.id, station));
    const stations = [...stationsById.values()];
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const query = `?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;
    status.textContent = `Processing the last 7 days from ${stations.length} regional station${stations.length === 1 ? "" : "s"}…`;
    const readings = await inBatches(stations, async station => {
      try {
        const response = await fetch(`${station.id}/observations${query}`, { headers: { Accept: "application/geo+json" } });
        if (!response.ok) throw new Error("Observation failed");
        const observations = (await response.json()).features;
        return { station, observations };
      } catch { return { station, observations: [] }; }
    });
    const reportingStations = readings.filter(({ observations }) => observations.length);
    reportingStations.slice(0, 10).forEach(({ station, observations }) => {
      const name = station.properties.name || station.properties.stationIdentifier;
      const latest = observations[0];
      const humidity = mean(observations.map(item => item.properties.relativeHumidity?.value).filter(Number.isFinite));
      const reading = latest ? `${displayReading(latest)} · 7d avg ${humidity == null ? "—" : `${Math.round(humidity)}% RH`}` : "No recent reading";
      stationList.insertAdjacentHTML("beforeend", `<div class="station"><strong>${name}</strong><span>${station.properties.stationIdentifier}</span><span class="station-reading">${reading}</span></div>`);
    });
    const humidityValues = reportingStations.flatMap(({ observations }) => observations.map(item => item.properties.relativeHumidity?.value).filter(Number.isFinite));
    const temperatureValues = reportingStations.flatMap(({ observations }) => observations.map(item => celsiusToFahrenheit(item.properties.temperature?.value)).filter(Number.isFinite));
    const wetHourValues = reportingStations.flatMap(({ observations }) => observations.map(item => item.properties.precipitationLastHour?.value).filter(Number.isFinite));
    const averageHumidity = mean(humidityValues) || 0;
    const averageTemperature = mean(temperatureValues) || 0;
    const averageWetHourMm = mean(wetHourValues) || 0;
    const temperatureBoost = averageTemperature >= 48 && averageTemperature <= 75 ? 7 : averageTemperature >= 40 && averageTemperature <= 84 ? 3 : -4;
    const liveScore = Math.min(92, Math.max(20, Math.round(45 + averageHumidity * .29 + Math.min(12, averageWetHourMm * 6) + temperatureBoost)));
    document.querySelector("#activity-score").textContent = `${liveScore}%`;
    document.querySelector("#activity-meter").style.width = `${liveScore}%`;
    document.querySelector("#activity-summary").textContent = `Experimental score from 7-day temperature (${averageTemperature ? `${Math.round(averageTemperature)}°F` : "—"}), humidity, and precipitation across ${reportingStations.length} reporting regional station${reportingStations.length === 1 ? "" : "s"}.`;
    const alert = JSON.parse(localStorage.getItem("mushroom-radar-alert") || "null");
    if (alert && liveScore >= alert.threshold) {
      document.querySelector("#alert-status").textContent = `Good conditions now: ${liveScore}% meets your ${alert.species} reminder threshold.`;
      if ("Notification" in window && Notification.permission === "granted") new Notification("Mushroom Radar", { body: `Conditions are ${liveScore}% for your ${alert.species} reminder.` });
    }
    if (reportingStations.length > 10) stationList.insertAdjacentHTML("beforeend", `<p class="weather-status">Showing 10 of ${reportingStations.length} reporting stations; all were included in the score.</p>`);
    status.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. Covers the previous 7 days; station reports can be delayed.`;
  } catch (error) {
    status.textContent = "Live station data is temporarily unavailable. The map is still showing its sample forecast.";
  } finally { refresh.disabled = false; }
}

document.querySelector("#refresh-weather").addEventListener("click", loadWeather);
loadWeather();

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
