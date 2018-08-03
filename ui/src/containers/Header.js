import React, {Component} from 'react';
import {connect} from 'react-redux';

import '../styles/Header.css';

class Header extends Component {

  render() {
    return (
      <table className="table-header">
        <tbody>
          <tr>
            <td>
              <h1> Planning Poker </h1>
            </td>
            <td className='game-default'>
              <table>
                <tbody>
                  <tr>
                    <td>
                      {this.props.sessionId}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {this.props.playerName}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
}

function mapStateToProps(state) {
  return {
    sessionId: state.game.sessionId,
    playerName: state.game.playerName,
  };
}

export default connect(mapStateToProps)(Header);
