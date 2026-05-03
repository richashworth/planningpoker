import { useSelector } from 'react-redux'
import { useTheme } from '@mui/material/styles'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import { Bar } from 'react-chartjs-2'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

// Solid pill behind the consensus tick label, label re-drawn in white on top.
const consensusAxisPillPlugin = {
  id: 'consensusAxisPill',
  afterDraw(chart, _args, opts) {
    if (!opts) return
    const { consensus, legalEstimates, pillBg, pillFg } = opts
    if (consensus == null) return
    const idx = legalEstimates.indexOf(consensus)
    if (idx === -1) return

    const xScale = chart.scales.x
    if (!xScale) return
    const ctx = chart.ctx

    const label = String(consensus)
    const fontSize = 12
    const padX = 10
    const padY = 3

    ctx.save()
    const fontFamily = (chart.canvas && getComputedStyle(chart.canvas).fontFamily) || 'sans-serif'
    ctx.font = `700 ${fontSize}px ${fontFamily}`
    const textWidth = ctx.measureText(label).width
    const pillW = textWidth + padX * 2
    const pillH = fontSize + padY * 2

    const cx = xScale.getPixelForValue(idx)
    const cy = xScale.top + xScale.height * 0.55

    ctx.fillStyle = pillBg
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath()
      ctx.roundRect(cx - pillW / 2, cy - pillH / 2, pillW, pillH, 999)
      ctx.fill()
    } else {
      ctx.fillRect(cx - pillW / 2, cy - pillH / 2, pillW, pillH)
    }

    ctx.fillStyle = pillFg
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, cx, cy)
    ctx.restore()
  },
}

export default function ResultsChart({ consensus = null }) {
  const results = useSelector((state) => state.results)
  const legalEstimates = useSelector((state) => state.game.legalEstimates)
  const theme = useTheme()

  const estimates = results.map((x) => x.estimateValue)
  const aggregateData = legalEstimates.map((x) => estimates.filter((y) => y === x).length)

  const tickColor = theme.palette.text.secondary
  const gridColor = theme.palette.divider
  const barColor = theme.palette.primary.main
  const barMutedColor = theme.palette.chart.barMuted

  const isHighlighted = (label) => consensus != null && label === consensus
  const backgroundColor = legalEstimates.map((l) => (isHighlighted(l) ? barColor : barMutedColor))
  const borderColor = backgroundColor
  const borderWidth = legalEstimates.map(() => 0)
  const hoverBackgroundColor = backgroundColor

  // Hide the underlying tick label for the consensus index — the axis-pill
  // plugin re-draws it in white on top, and we don't want kerning bleed.
  const xTickColor = (ctx) => (isHighlighted(legalEstimates[ctx.index]) ? 'transparent' : tickColor)

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      consensusAxisPill: {
        consensus,
        legalEstimates,
        pillBg: theme.palette.primary.main,
        pillFg: '#fff',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: Math.max(...aggregateData) < 8 ? 1 : undefined,
          color: tickColor,
        },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      x: {
        ticks: { color: xTickColor, font: { size: 12, weight: 500 } },
        grid: { color: 'transparent' },
        border: { color: gridColor },
      },
    },
  }

  const data = {
    labels: legalEstimates,
    datasets: [
      {
        data: aggregateData,
        backgroundColor,
        borderColor,
        borderWidth,
        borderRadius: 4,
        hoverBackgroundColor,
      },
    ],
  }

  return <Bar options={options} data={data} plugins={[consensusAxisPillPlugin]} />
}
