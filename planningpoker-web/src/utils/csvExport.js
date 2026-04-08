/**
 * Escape a CSV field value.
 * Wraps in double quotes if the value contains a comma, quote, or newline.
 * Escapes internal double quotes by doubling them.
 * Prefixes formula injection characters (=, +, -, @) with a single quote.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeField(value) {
  const str = value == null ? '' : String(value)

  // CSV injection protection: prefix formula-starting chars with single quote
  let escaped = str
  if (/^[=+\-@]/.test(escaped)) {
    escaped = "'" + escaped
  }

  // Wrap in double quotes if contains comma, double quote, or newline
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    escaped = '"' + escaped.replace(/"/g, '""') + '"'
  }

  return escaped
}

/**
 * Generate a CSV string from round history.
 *
 * @param {Array<{label: string, consensus: string, timestamp: string, mode: string, min: string|null, max: string|null, variance: string|null, votes: Array<{userName: string, estimateValue: string}>}>} rounds
 * @param {string[]} playerNames - Sorted array of all unique player names across rounds
 * @returns {string} CSV string
 */
export function generateCsv(rounds, playerNames) {
  const headers = ['Label', 'Consensus', 'Timestamp', 'Mode', 'Min', 'Max', 'Variance', ...playerNames]
  const rows = [headers.join(',')]

  for (const round of rounds) {
    const voteMap = {}
    for (const { userName, estimateValue } of round.votes) {
      voteMap[userName] = estimateValue
    }

    const playerVotes = playerNames.map((name) => escapeField(voteMap[name] || ''))

    const row = [
      escapeField(round.label || ''),
      escapeField(round.consensus || ''),
      escapeField(round.timestamp || ''),
      escapeField(round.mode || ''),
      escapeField(round.min || ''),
      escapeField(round.max || ''),
      escapeField(round.variance || ''),
      ...playerVotes,
    ]

    rows.push(row.join(','))
  }

  return rows.join('\n')
}

/**
 * Trigger a browser file download of a CSV string.
 *
 * @param {string} csvString - The CSV content to download
 * @param {string} [filename='planning-poker-export.csv'] - The filename for the download
 */
export function downloadCsv(csvString, filename = 'planning-poker-export.csv') {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
