import React, {Component} from 'react';
import {Table} from 'react-bootstrap';
import {connect} from 'react-redux';
import _ from 'lodash';

class ResultsTable extends Component {

  render() {
    const notVoted = _.difference(this.props.users, this.props.results.map(x => x['userName']));

    const voteFreqs = _.countBy(this.props.results, x => x['estimateValue']);
    const countedResults = this.props.results.map(x => ({...x, ...{'count': voteFreqs[parseInt(x['estimateValue'], 10)]}}));
    const sortedResults = _.orderBy(countedResults, ['count', 'userName']);

    return (
      <div className="tbl-scroll">
        <Table responsive striped>
          <tbody>
          <tr>
            <th>User</th>
            <th>Vote</th>
          </tr>
          {sortedResults.map(x => _renderVoteRow(x))}
          {notVoted.map((x) => _renderUserRow(x))}
          </tbody>
        </Table>
      </div>
    );
  }
}

function _renderUserRow(data) {
  return (
    <tr key={data}>
      <td>{_.startCase(data)}</td>
      <td>-</td>
    </tr>
  )
}

function _renderVoteRow(data) {
  return (
    <tr key={data.userName}>
      <td>{_.startCase(data.userName)}</td>
      <td>{data.estimateValue}</td>
    </tr>
  )
}

function mapStateToProps(state) {
  return {
    results: state.results,
    users: state.users
  };
}

export default connect(mapStateToProps)(ResultsTable);
