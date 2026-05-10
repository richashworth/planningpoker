// "?" means "unsure" — treat it as an abstention for auto-pick so a noisy mix of unsures can't
// hijack the consensus. The host can still set "?" manually via the consensus card rail.
const UNSURE = '?'

// Tie-break to the larger value so forecasts lean conservative (over- > under-estimate).
// "Larger" is defined by position in legalEstimates when provided — that captures intent for
// non-numeric schemes (XS < S < ... < XXL) and for custom schemes in the host's chosen order.
// Without a scheme, fall back to numeric comparison if both values parse as numbers, then to
// lexical order as a last resort.
function compareValues(a, b, legalEstimates) {
  if (legalEstimates && legalEstimates.length > 0) {
    const ai = legalEstimates.indexOf(a)
    const bi = legalEstimates.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return 1
    if (bi !== -1) return -1
  }
  const an = Number(a)
  const bn = Number(b)
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn
  return a.localeCompare(b)
}

export function calcConsensus(results, legalEstimates = null) {
  if (!results || results.length === 0) return null

  const counts = {}
  for (const { estimateValue } of results) {
    counts[estimateValue] = (counts[estimateValue] || 0) + 1
  }

  const candidates = Object.keys(counts).filter((v) => v !== UNSURE)
  if (candidates.length === 0) return null

  const maxCount = Math.max(...candidates.map((v) => counts[v]))
  const tied = candidates.filter((v) => counts[v] === maxCount)
  if (tied.length === 1) return tied[0]

  return [...tied].sort((a, b) => compareValues(a, b, legalEstimates)).pop()
}

export function calcStats(results, legalEstimates = null) {
  if (!results || results.length === 0) {
    return { mode: null, min: null, max: null, variance: null }
  }

  const mode = calcConsensus(results, legalEstimates)

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
