import React, { Component } from 'react';
import { connect } from 'react-redux';

class Header extends Component {

  render() {
          console.log("sesh")
          console.log(this.props.sessionId)
          console.log(this.props.playerName)

    return (
        <div>
          <h1> Planning Poker </h1>
          <h3> {this.props.sessionId}</h3>
          <h3> {this.props.playerName}</h3>
        </div>
    );
  }
}

function mapStateToProps(state){
  // TODO: add container <GameInfo/> to header for these items
  if(!state.game){
    return {
      sessionId: '-',
      playerName: 'rich'
    }
  }else
  console.log('mapping+'+state.game)
  return {
    sessionId: state.game.sessionId,
    playerName: state.game.playerName,
  };
}

export default connect(mapStateToProps)(Header);
