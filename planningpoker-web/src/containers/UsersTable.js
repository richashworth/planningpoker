import React, {Component} from 'react';
import {Table} from 'react-bootstrap';
import {connect} from 'react-redux';
import _ from 'lodash';

class UsersTable extends Component {

  render() {
    return (
      <div className="tbl-scroll">
        <Table responsive striped>
          <tbody>
          <tr>
            <th> {this.props.heading} </th>
          </tr>
          {this.props.users.map(_.startCase).sort().map((x) => _renderUserRow(x))}
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