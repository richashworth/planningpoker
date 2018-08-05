import React, {Component} from 'react';
import {connect} from 'react-redux';
import {joinGame, userRegistered} from '../actions';
import NameInput from '../components/NameInput';

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
      this.props.userRegistered();
      this.props.history.push('/game');
    });
  }

  render() {
    return (
      <div className="container">
        <form onSubmit={this.onFormSubmit} >
          <NameInput
            playerName={this.state.playerName}
            onPlayerNameInputChange={this.onPlayerNameInputChange}/>
          <div className="form-group">
            <label> Session ID </label>
            <input
              className="form-control"
              value={this.state.sessionId}
              placeholder="required"
              required
              type="number"
              min="1"
              onChange={this.onSessionInputChange}
            />
        </div>
          <button type="submit" className="btn btn-primary">
            Join Game
          </button>
        </form>
      </div>
    );
  }
}

export default connect(null, {joinGame, userRegistered})(JoinGame);
