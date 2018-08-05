import React, {Component} from 'react';
import {connect} from 'react-redux';

class UsersTable extends Component {

  render() {
    return (
      <div>
        <table>
          <tbody>
          <tr>
            <th>User</th>
          </tr>
          {this.props.users.map((x) => _renderUserRow(x))}
          </tbody>
        </table>
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
