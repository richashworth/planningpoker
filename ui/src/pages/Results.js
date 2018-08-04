import React, {Component} from 'react';
import {connect} from 'react-redux';
import SockJsClient from 'react-stomp';
import {Grid, Row, Col} from 'react-bootstrap';
import ResultsTable from '../containers/ResultsTable';
import {resetSession, resultsUpdated} from '../actions';

import '../styles/Results.css';

class Results extends Component {

  render() {

    const adminButton =
        <Row>
          <button type="button" className="btn-next btn btn-primary btn-lg"
          onClick={() => this.props.resetSession(
                this.props.playerName, this.props.sessionId,
                () => this.props.history.push('/vote'))}>
                Next Item
              </button>
        </Row>

    return (
      <div>
        <SockJsClient url='http://localhost:9000/stomp' topics={[`/topic/results/${this.props.sessionId}`]}
          onMessage=
          {(msg) => {
            if(msg.length < 1) this.props.history.push('/vote')
            else this.props.resultsUpdated(msg)
          }}/>

        <div>
          <Grid>
            <Row className="show-grid">
              <Col xs={12} md={8}>
                Chart goes here
              </Col>
              <Col xs={6} md={4}>
                <ResultsTable/>
              </Col>
            </Row>
            {this.props.isAdmin && adminButton}
          </Grid>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isAdmin: state.game.isAdmin,
    sessionId: state.game.sessionId,
    playerName: state.game.playerName,
  };
}

export default connect(mapStateToProps, {resultsUpdated, resetSession})(Results)
