import React, { Component } from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';

import Header from './containers/Header';
import Welcome from './pages/Welcome';
import JoinGame from './pages/JoinGame';
import CreateGame from './pages/CreateGame';

class App extends Component {
  render() {
    return (
      <div>
        <Header />
        <BrowserRouter>
          <div>
            <Switch>
              {/* put most specific routes at top (Switch tag facilitates this) */}
              <Route path="/create" component={CreateGame} />
              <Route path="/join" component={JoinGame} />
              <Route path="/" component={Welcome} />
            </Switch>
          </div>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
