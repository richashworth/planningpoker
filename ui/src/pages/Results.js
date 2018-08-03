import React, {Component} from 'react';
import {connect} from 'react-redux';
import SockJsClient from 'react-stomp';

import '../styles/Results.css';

class Results extends Component {

  render() {

    const adminButton = <button type="button" className="btn-next btn btn-primary btn-lg">
      Next Item
    </button>

    return (
       <div>
         <SockJsClient url='http://localhost:9000/stomp' topics={[`/topic/results/${this.props.sessionId}`]}
           onMessage={(msg) => { console.log('socket sent: '+JSON.stringify(msg)); }}
           ref={ (client) => { this.clientRef = client }} />

        {this.props.isAdmin ? adminButton : ''}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isAdmin: state.game.isAdmin,
    sessionId: state.game.sessionId
  };
}

export default connect(mapStateToProps)(Results)
