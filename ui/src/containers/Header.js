import React, {Component} from 'react';
import {connect} from 'react-redux';

import '../styles/Header.css';

class Header extends Component {

  render() {
    return (
      <table>
        <tbody>
        <tr>
          <td>
            <h1> Planning Poker </h1>
          </td>
          <td className='game-default'>
            <table>
              <tbody>
              <tr>
                {this.props.sessionId}
              </tr>
              <tr>
                {this.props.playerName}
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
