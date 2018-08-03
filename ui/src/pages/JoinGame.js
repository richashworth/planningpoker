import React, {Component} from 'react';
import {connect} from 'react-redux';
import {joinGame} from '../actions';

class JoinGame extends Component {

  constructor(props) {
    super(props);

    this.state = {playerName: '', sessionId: ''};

    this.onPlayerNameInputChange = this.onPlayerNameInputChange.bind(this);
    this.onSessionInputChange = this.onSessionInputChange.bind(this);
    this.onFormSubmit = this.onFormSubmit.bind(this);
  }

  onPlayerNameInputChange(event) {
    this.setState({playerName: event.target.value});
  }

  onSessionInputChange(event) {
    this.setState({sessionId: event.target.value});
  }

  onFormSubmit(event) {
    // tells the browser not to make a POST request to the server (default form behaviour)
    event.preventDefault();

    this.props.joinGame(this.state.playerName, this.state.sessionId, () => {
      this.props.history.push('/vote')
    });
  }

  render() {
    return (
      <form onSubmit={this.onFormSubmit} className="input-group">
        <div>
          <label>Name</label>
          <input
            placeholder="Name"
            className="form-input"
            value={this.state.playerName}
            onChange={this.onPlayerNameInputChange}
          />
          <input
            placeholder="SessionId"
            className="form-input"
            value={this.state.sessionId}
            type="number"
            min="1"
            onChange={this.onSessionInputChange}
          />
        </div>
        <div>
          <button type="submit" className="btn btn-primary">
            Join Game
          </button>
        </div>
      </form>
    );
  }
}

export default connect(null, {joinGame})(JoinGame);
