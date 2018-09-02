import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Col, Grid, Row} from 'react-bootstrap';
import ResultsTable from '../containers/ResultsTable';
import ResultsChart from '../containers/ResultsChart';
import {resetSession} from '../actions';

import '../styles/Game.css';

class Results extends Component {

  render() {
    const adminButton =
      <Row className="admin-btn-row">
        <button type="button" className="btn-next btn btn-primary btn-lg"
                onClick={() => this.props.resetSession(
                  this.props.playerName, this.props.sessionId,)}>
          Next Item
        </button>
      </Row>;

    return (
      <div>
        <Grid>
          <Row>
            <h4>Results</h4>
          </Row>
          <Row>
            <Col xs={12} md={9} className="game-pane-primary">
              <ResultsChart/>
            </Col>
            <Col xs={6} md={3}>
              <ResultsTable/>
            </Col>
          </Row>
          {this.props.isAdmin && adminButton}
        </Grid>
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

export default connect(mapStateToProps, {resetSession})(Results)
