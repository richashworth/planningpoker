function escapeField(value) {
  const str = value == null ? '' : String(value)

  // CSV injection protection: prefix formula-starting chars with single quote
  let escaped = str
  if (/^[=+\-@]/.test(escaped)) {
    escaped = "'" + escaped
  }

  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    escaped = '"' + escaped.replace(/"/g, '""') + '"'
  }

  return escaped
}

export function generateCsv(rounds, playerNames) {
  const headers = ['Label', 'Consensus', 'Timestamp', ...playerNames]
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
      ...playerVotes,
    ]

    rows.push(row.join(','))
  }

  return rows.join('\n')
}

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
