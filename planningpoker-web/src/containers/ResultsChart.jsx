import React from 'react';
import { useSelector } from 'react-redux';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { LEGAL_ESTIMATES } from '../config/Constants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function ResultsChart() {
  const results = useSelector(state => state.results);

  const estimates = results.map(x => x.estimateValue);
  const aggregateData = LEGAL_ESTIMATES.map(x => estimates.filter(y => y === x).length);

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
          color: '#a0a0a0',
        },
        grid: {
          color: '#262626',
        },
        border: {
          color: '#262626',
        },
      },
      x: {
        ticks: {
          color: '#a0a0a0',
        },
        grid: {
          color: 'transparent',
        },
        border: {
          color: '#262626',
        },
      },
    },
  };

  const data = {
    labels: LEGAL_ESTIMATES,
    datasets: [{
      data: aggregateData,
      backgroundColor: 'rgba(59, 130, 246, 0.35)',
      borderColor: 'rgba(59, 130, 246, 0.7)',
      borderWidth: 1,
      borderRadius: 4,
      hoverBackgroundColor: 'rgba(59, 130, 246, 0.55)',
    }],
  };

  return <Bar options={options} data={data} />;
}
