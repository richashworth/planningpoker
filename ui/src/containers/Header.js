import React, { Component } from 'react';
import { connect } from 'react-redux';

import '../styles/Header.css';

class Header extends Component {

  render() {
          console.log("rendering Header")
          console.log(this.props.sessionId)
          console.log(this.props.playerName)

    return (
          <table>
            <tr>
              <td>
                <h1> Planning Poker </h1>
              </td>
              <td className='game-details'>
                <tr>
                  {this.props.sessionId}
                </tr>
                <tr>
                  {this.props.playerName}
                </tr>
              </td>
            </tr>
          </table>
    );
  }
}

function mapStateToProps(state){
  console.log('mapping+'+state.game.sessionId)
  return {
    sessionId: state.game.sessionId,
    playerName: state.game.playerName,
  };
}

export default connect(mapStateToProps)(Header);
