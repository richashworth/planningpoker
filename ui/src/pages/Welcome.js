import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import '../styles/Welcome.css';

class Welcome extends Component {
  render() {
    return (
      <div class="container align-self-center">
        <div class="row btn-row justify-content-center">
          <Link to ="/create">
            <button type="button" class="btn btn-primary btn-lg">
              Create Game
            </button>
          </Link>
        </div>
        <div class="row btn-row justify-content-center">
          <Link to ="/join">
            <button type="button" class="btn btn-primary btn-lg">
              Join Game
            </button>
          </Link>
        </div>
      </div>
    );
  }
}

export default Welcome;
