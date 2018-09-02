import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Bar} from 'react-chartjs-2';

import {LEGAL_ESTIMATES} from '../config/Constants';

class ResultsChart extends Component {

  _aggregate(data) {
    const estimates = data.map(x => x['estimateValue']);
    return LEGAL_ESTIMATES.map(x => estimates.filter(y => y === x).length);
  }

  render() {
    const aggregateData = this._aggregate(this.props.results);

    const chartOptions = {
      legend: {
        display: false
      },
      tooltips: {
        enabled: false
      },
      scales: {
        yAxes: [{
          ticks: {
            suggestedMin: 0,
            stepSize: Math.max(...aggregateData) < 8 ? 1 : undefined
          }
        }]
      }
    };

    const inputData = {
      labels: LEGAL_ESTIMATES,
      datasets: [
        {
          backgroundColor: 'rgba(229,239,245)',
          borderColor: 'rgba(147,190,216)',
          borderWidth: 1,
          data: aggregateData
        }
      ]
    };

    return <Bar responsive options={chartOptions} data={inputData}/>;
  }
}

function mapStateToProps(state) {
  return {
    results: state.results
  };
}

export default connect(mapStateToProps)(ResultsChart);
