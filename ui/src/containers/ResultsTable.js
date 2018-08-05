import React, {Component} from 'react';
import { Table } from 'react-bootstrap';
import {connect} from 'react-redux';

class ResultsTable extends Component {

  render() {
    return (
      <div>
        <Table responsive>
          <tbody>
          <tr>
            <th>User</th>
            <th>Vote</th>
          </tr>
          {this.props.results.map((x) => _renderVoteRow(x))}
          </tbody>
        </Table>
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
