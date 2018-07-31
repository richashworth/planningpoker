import React, {Component} from 'react';
import { connect } from 'react-redux';
import { createGame } from '../actions';

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
      this.props.history.push('/vote')
    });
  }

  render() {
    return (
      <form onSubmit={this.onFormSubmit} className="input-group">
        <div>
        <input
          placeholder="Name"
          className="form-input"
          value={this.state.playerName}
          onChange={this.onPlayerNameInputChange}
        />
      </div>
      <div>
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </div>
      </form>
    );
  }
}

export default connect(null, { createGame })(CreateGame);
