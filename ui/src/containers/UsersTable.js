import React, {Component} from 'react';
import {Table} from 'react-bootstrap';
import {connect} from 'react-redux';

class UsersTable extends Component {

  render() {
    return (
      <div>
        <Table>
          <tbody>
          <tr>
            <th> Registered Users</th>
          </tr>
          {this.props.users.map((x) => _renderUserRow(x))}
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
    users: state.users
  };
}

export default connect(mapStateToProps)(UsersTable);
