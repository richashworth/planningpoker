export function calcConsensus(results) {
  if (!results || results.length === 0) return null

  const counts = {}
  for (const { estimateValue } of results) {
    counts[estimateValue] = (counts[estimateValue] || 0) + 1
  }

  const maxCount = Math.max(...Object.values(counts))
  const candidates = Object.keys(counts)
    .filter((v) => counts[v] === maxCount)
    .sort()

  return candidates[0]
}

export function calcStats(results) {
  if (!results || results.length === 0) {
    return { mode: null, min: null, max: null, variance: null }
  }

  const mode = calcConsensus(results)

  const numericValues = results
    .map(({ estimateValue }) => Number(estimateValue))
    .filter((n) => Number.isFinite(n))

  const isNumeric = numericValues.length === results.length

  if (!isNumeric) {
    return { mode, min: null, max: null, variance: null }
  }

  const min = String(Math.min(...numericValues))
  const max = String(Math.max(...numericValues))

  const mean = numericValues.reduce((sum, n) => sum + n, 0) / numericValues.length
  const variance =
    numericValues.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numericValues.length

  return {
    mode,
    min,
    max,
    variance: variance.toFixed(2),
  }
}
