import React, {Component} from 'react';
import {connect} from 'react-redux';

class ResultsTable extends Component {

  render() {
    console.log('in render restab');
    return (
      <div>
        <table>
          <tbody>
          <tr>
            <th>User</th>
            <th>Vote</th>
          </tr>
          {this.props.results.map((x) => _renderVoteRow(x))}
          </tbody>
        </table>
      </div>
    );
  }
}

function _renderVoteRow(data) {
  return (
    <tr key={data.userName}>
      <td>{data.userName}</td>
      <td>{data.estimateValue}</td>
    </tr>
  )
}

function mapStateToProps(state) {
  return {
    results: state.results
  };
}

export default connect(mapStateToProps)(ResultsTable);
