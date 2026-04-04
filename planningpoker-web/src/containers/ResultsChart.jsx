import React from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function ResultsChart() {
  const results = useSelector(state => state.results);
  const legalEstimates = useSelector(state => state.game.legalEstimates);
  const theme = useTheme();

  const estimates = results.map(x => x.estimateValue);
  const aggregateData = legalEstimates.map(x => estimates.filter(y => y === x).length);

  const tickColor = theme.palette.text.secondary;
  const gridColor = theme.palette.divider;

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
  };

  const data = {
    labels: legalEstimates,
    datasets: [{
      data: aggregateData,
      backgroundColor: 'rgba(102, 126, 234, 0.35)',
      borderColor: 'rgba(102, 126, 234, 0.7)',
      borderWidth: 1,
      borderRadius: 4,
      hoverBackgroundColor: 'rgba(102, 126, 234, 0.55)',
    }],
  };

  return <Bar options={options} data={data} />;
}
