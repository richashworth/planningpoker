import React, {Component} from 'react';
import {connect} from 'react-redux';
import SockJsClient from 'react-stomp';

import ResultsTable from '../containers/ResultsTable';
import {resultsUpdated} from '../actions';

import '../styles/Results.css';

class Results extends Component {

  render() {

    const adminButton =
      <button type="button" className="btn-next btn btn-primary btn-lg">
        Next Item
      </button>

    return (
      <div>
         <div>
           <SockJsClient url='http://localhost:9000/stomp' topics={[`/topic/results/${this.props.sessionId}`]}
             onMessage={(msg) => { 
               this.props.resultsUpdated(msg);
               }}

             ref={ (client) => { this.clientRef = client }} />

        </div>
        <div>
           <ResultsTable/>
           {this.props.isAdmin ? adminButton : ''}
         </div>
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

export default connect(mapStateToProps, {resultsUpdated})(Results)
