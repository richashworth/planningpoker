import React, {Component} from 'react';
import {connect} from 'react-redux';
import {vote} from '../actions';

import {Grid, Row, Col} from 'react-bootstrap';

import '../styles/Vote.css';

class Vote extends Component {

  render() {

    const VoteButtons = ([1, 2, 3, 5, 8, 13, 20, 100].map(estimateValue => (
      <button type="button" className="btn btn-primary btn-lg" key={estimateValue}
        onClick={() => this.props.vote(
                this.props.playerName, this.props.sessionId, estimateValue,
                () => this.props.history.push('/results')
              )}>
              {estimateValue}
            </button>
    )));

    const CoffeeSymbol = '\u2615';

    const CoffeeBreakBtn = (
      <button type="button" className="btn btn-primary btn-lg coffee"
        onClick={() => this.props.vote(
                this.props.playerName, this.props.sessionId, CoffeeSymbol,
                () => this.props.history.push('/results')
              )}>
              <div>
                {CoffeeSymbol}
              </div>
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
       UsersList
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
