/**
 * Calculate the consensus (mode) from an array of vote results.
 * On tie, picks the value that comes first alphabetically.
 *
 * @param {Array<{userName: string, estimateValue: string}>} results
 * @returns {string|null} The mode value, or null if results is empty.
 */
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

/**
 * Calculate statistics from an array of vote results.
 * For numeric schemes: returns mode, min, max, and population variance (2dp).
 * For non-numeric schemes: returns only mode; min, max, variance are null.
 *
 * @param {Array<{estimateValue: string}>} results
 * @returns {{ mode: string|null, min: string|null, max: string|null, variance: string|null }}
 */
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
  const variance = numericValues.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numericValues.length

  return {
    mode,
    min,
    max,
    variance: variance.toFixed(2),
  }
}
