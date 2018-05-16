import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import '../styles/Welcome.css';

class Welcome extends Component {
  render() {
    return (
      <div className="container align-self-center">
        <div className="row btn-row justify-content-center">
          <Link to ="/create">
            <button type="button" className="btn btn-primary btn-lg">
              Create Game
            </button>
          </Link>
        </div>
        <div className="row btn-row justify-content-center">
          <Link to ="/join">
            <button type="button" className="btn btn-primary btn-lg">
              Join Game
            </button>
          </Link>
        </div>
      </div>
    );
  }
}

export default Welcome;
