// Simple explainable habitat scoring function.
export function scoreHabitat(loc, playbook){
  // loc: {soilTemp2, soilTemp4, soilTemp8, soilMoisture, rainLast7d, elevation, slope, aspect, canopy, forestType}
  // playbook: species requirements (min/max windows, preferences)
  let score = 0
  const reasons = []

  // Rain window (more recent rain preferred)
  const rainScore = Math.min(30, Math.round((loc.rainLast7d || 0) * 100))
  score += rainScore
  reasons.push({key:'Rain (7d mm)', value:loc.rainLast7d, points:rainScore})

  // Soil temperature: prefer 2" around ideal
  const ideal2 = playbook.idealSoilTemp2 || 55
  const tempDelta = Math.abs((loc.soilTemp2||0) - ideal2)
  const tempScore = Math.max(0, 30 - tempDelta)
  score += tempScore
  reasons.push({key:'SoilTemp2', value:loc.soilTemp2, points:tempScore})

  // Soil moisture
  const moisture = loc.soilMoisture || 0
  const moistureScore = Math.max(0, 20 - Math.abs(moisture - (playbook.idealSoilMoisture||20)))
  score += moistureScore
  reasons.push({key:'SoilMoisture', value:moisture, points:moistureScore})

  // Elevation preference
  const elevPref = playbook.preferredElevation || null
  let elevScore = 10
  if(elevPref){
    const d = Math.abs((loc.elevation||0) - elevPref)
    elevScore = Math.max(0, 10 - Math.floor(d/2000))
  }
  score += elevScore
  reasons.push({key:'Elevation', value:loc.elevation, points:elevScore})

  const final = Math.max(0, Math.min(100, Math.round(score)))
  // For now we attach reasons so callers could show breakdown
  // return just number for marker, but store breakdown in loc if needed
  loc._habitat = {score: final, breakdown: reasons}
  return final
}

// re-export named default
export { scoreHabitat as scoreHabitat }
