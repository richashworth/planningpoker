import React, {Component} from 'react';
import {connect} from 'react-redux';
import {createGame, gameCreated} from '../actions';
import NameInput from '../components/NameInput';

import '../styles/Create.css';

class CreateGame extends Component {

  constructor(props) {
    super(props);

    this.state = {playerName: ''};

    this.onPlayerNameInputChange = this.onPlayerNameInputChange.bind(this);
    this.onFormSubmit = this.onFormSubmit.bind(this);
  }

  onPlayerNameInputChange(event) {
    this.setState({playerName: event.target.value});
  }

  onFormSubmit(event) {
    // tells the browser not to make a POST request to the server (default form behaviour)
    event.preventDefault();

    this.props.createGame(this.state.playerName, () => {
      this.props.gameCreated();
      this.props.history.push('/game');
    });
  }

  render() {
    return (
      <div className="container">
        <form onSubmit={this.onFormSubmit}>
          <NameInput
            playerName={this.state.playerName}
            onPlayerNameInputChange={this.onPlayerNameInputChange}/>
          <button type="submit" className="btn btn-primary">
            Start Game
          </button>
        </form>
      </div>
    );
  }
}

export default connect(null, {createGame, gameCreated})(CreateGame);
