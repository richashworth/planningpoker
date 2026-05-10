// Escape pipes and newlines so a label can't break the table layout when pasted into
// Jira/Slack/GitHub. Backslash-escape pipe; collapse hard newlines to a single space.
function escapeCell(value) {
  const str = value == null ? '' : String(value)
  return str.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

function formatEstimate(round) {
  if (round.consensus != null && round.consensus !== '') {
    return escapeCell(round.consensus)
  }
  if (Array.isArray(round.votes) && round.votes.length > 0) {
    return round.votes
      .map((v) => `${escapeCell(v.userName)}: ${escapeCell(v.estimateValue)}`)
      .join(', ')
  }
  return '—'
}

export function generateMarkdownTable(rounds) {
  const lines = ['| Label | Estimate |', '| --- | --- |']
  for (const round of rounds) {
    const label = round.label ? escapeCell(round.label) : '_No label_'
    lines.push(`| ${label} | ${formatEstimate(round)} |`)
  }
  return lines.join('\n')
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  // Fallback for non-secure contexts and older browsers.
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(ta)
  }
}
