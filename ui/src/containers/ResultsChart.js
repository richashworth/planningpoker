import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Bar} from 'react-chartjs-2'

import {LEGAL_ESTIMATES} from '../config/Constants';

class ResultsChart extends Component {


  aggregate(data) {
    const estimates = data.map(x => x['estimateValue'])
    return LEGAL_ESTIMATES.map(x => estimates.filter(y => y === x).length);
  }

  render() {

    const chartOptions= {
      legend: {
        display: false
      },
      tooltips: {
        callbacks: {
          label: function(tooltipItem) {
            return tooltipItem.yLabel;
          }
        }
      }
    };


    const inputData = {
      options: {
      },
      labels: LEGAL_ESTIMATES,
      datasets: [
        {
          backgroundColor: 'rgba(255,99,132,0.2)',
          borderColor: 'rgba(255,99,132,1)',
          borderWidth: 1,
          hoverBackgroundColor: 'rgba(255,99,132,0.4)',
          hoverBorderColor: 'rgba(255,99,132,1)',
          data: this.aggregate(this.props.results)
        }
      ]
    };
    return (
      <div>
        <Bar options={chartOptions}  data={inputData}/>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    results: state.results
  };
}

export default connect(mapStateToProps)(ResultsChart);
