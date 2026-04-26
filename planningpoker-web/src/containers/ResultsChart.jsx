import { useSelector } from 'react-redux'
import { useTheme } from '@mui/material/styles'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import { Bar } from 'react-chartjs-2'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const DEFAULT_BG = 'rgba(102, 126, 234, 0.35)'
const DEFAULT_BORDER = 'rgba(102, 126, 234, 0.7)'
const DEFAULT_HOVER_BG = 'rgba(102, 126, 234, 0.55)'
const HIGHLIGHT_BG = 'rgba(102, 126, 234, 0.85)'
const HIGHLIGHT_BORDER = 'rgba(102, 126, 234, 1)'
const HIGHLIGHT_HOVER_BG = 'rgba(102, 126, 234, 0.95)'

export default function ResultsChart({ consensus = null }) {
  const results = useSelector((state) => state.results)
  const legalEstimates = useSelector((state) => state.game.legalEstimates)
  const theme = useTheme()

  const estimates = results.map((x) => x.estimateValue)
  const aggregateData = legalEstimates.map((x) => estimates.filter((y) => y === x).length)

  const tickColor = theme.palette.text.secondary
  const gridColor = theme.palette.divider

  const isHighlighted = (label) => consensus != null && label === consensus
  const backgroundColor = legalEstimates.map((l) => (isHighlighted(l) ? HIGHLIGHT_BG : DEFAULT_BG))
  const borderColor = legalEstimates.map((l) =>
    isHighlighted(l) ? HIGHLIGHT_BORDER : DEFAULT_BORDER,
  )
  const hoverBackgroundColor = legalEstimates.map((l) =>
    isHighlighted(l) ? HIGHLIGHT_HOVER_BG : DEFAULT_HOVER_BG,
  )
  const borderWidth = legalEstimates.map((l) => (isHighlighted(l) ? 2 : 1))

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
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
        ticks: { color: tickColor },
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

  return <Bar options={options} data={data} />
}
