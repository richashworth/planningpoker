import React, { Component } from 'react';

import '../styles/Welcome.css';

class Welcome extends Component {
  render() {
    return (
      <div class="container align-self-center">
        <div class="row btn-row justify-content-center">
          <button type="button" class="btn btn-primary btn-lg">
            Create Game
          </button>
        </div>
        <div class="row btn-row justify-content-center">
          <button type="button" class="btn btn-primary btn-lg">
            Join Game
          </button>
        </div>
      </div>
    );
  }
}

export default Welcome;
