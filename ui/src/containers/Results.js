import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Col, Grid, Row} from 'react-bootstrap';
import ResultsTable from '../containers/ResultsTable';
import ResultsChart from '../containers/ResultsChart';
import UsersTable from '../containers/UsersTable';
import {resetSession} from '../actions';

import '../styles/Results.css';

class Results extends Component {

  render() {
    const adminButton =
      <Row className="admin-btn-row">
        <button type="button" className="btn-next btn btn-primary btn-lg"
                onClick={() => this.props.resetSession(
                  this.props.playerName, this.props.sessionId,)}>
          Next Item
        </button>
      </Row>

    return (
      <div>
        <Grid>
          <h3> Results </h3>
          <Row className="show-grid">
            <Col xs={12} md={8}>
              <ResultsChart/>
            </Col>
            <Col xs={3} md={2}>
              <ResultsTable/>
            </Col>
            <Col xs={3} md={2}>
              <UsersTable filterVoted={true} heading='Not Voted'/>
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
