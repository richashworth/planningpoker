import React, {Component} from 'react';
import {Table} from 'react-bootstrap';
import {connect} from 'react-redux';
import _ from 'lodash';

class UsersTable extends Component {

  render() {
    const displayedUsers = this.props.filterVoted ?
      _.difference(this.props.users, this.props.results.map(x => x['userName'])) :
      this.props.users;

    return (
      <div>
        <Table responsive striped>
          <tbody>
          <tr>
            <th> {this.props.heading} </th>
          </tr>
          {displayedUsers.map((x) => _renderUserRow(x))}
          </tbody>
        </Table>
      </div>
    );
  }
}

function _renderUserRow(data) {
  return (
    <tr key={data}>
      <td>{data}</td>
    </tr>
  )
}

function mapStateToProps(state) {
  return {
    users: state.users,
    results: state.results
  };
}

export default connect(mapStateToProps)(UsersTable);
