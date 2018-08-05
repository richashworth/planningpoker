import React, {Component} from 'react';
import {connect} from 'react-redux';
import {vote} from '../actions';
import UsersTable from './UsersTable';
import {LEGAL_ESTIMATES} from '../config/Constants';

import {Col, Grid, Row} from 'react-bootstrap';

import '../styles/Vote.css';

class Vote extends Component {

  render() {

    const VoteButtons = (LEGAL_ESTIMATES.map(estimateValue => (
      <button type="button" className="btn-vote btn-primary btn-lg" key={estimateValue}
              onClick={() => this.props.vote(
                this.props.playerName, this.props.sessionId, estimateValue)}>
        {estimateValue}
      </button>
    )));

    const CoffeeSymbol = '\u2615';

    const CoffeeBreakBtn = (
      <button type="button" className="coffee-btn btn-vote btn-primary btn-lg"
              onClick={() => this.props.vote(
                this.props.playerName, this.props.sessionId, CoffeeSymbol)}>
        {CoffeeSymbol}
      </button>
    );

    return (
      <Grid>
        <Row>
          <Col xs={12} md={8}>
            Vote on the current item using the buttons below:
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={8}>
            {VoteButtons}
            {CoffeeBreakBtn}
          </Col>
          <Col xs={6} md={4}>
            <UsersTable/>
          </Col>
        </Row>
      </Grid>
    );
  }
}

function mapStateToProps(state) {
  return {
    sessionId: state.game.sessionId,
    playerName: state.game.playerName,
  };
}

export default connect(mapStateToProps, {vote})(Vote)
