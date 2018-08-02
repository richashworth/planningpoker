import React, {Component} from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import ReduxPromise from 'redux-promise';
import reducers from './reducers';

import Header from './containers/Header';
import Welcome from './pages/Welcome';
import JoinGame from './pages/JoinGame';
import CreateGame from './pages/CreateGame';
import Vote from './pages/Vote';
import Results from './pages/Results';

const createStoreWithMiddleware = applyMiddleware(ReduxPromise)(createStore);

class App extends Component {
  render() {
    return (
      <Provider store={createStoreWithMiddleware(reducers)}>
        <div>
          <Header/>
          <BrowserRouter>
            <div>
              <Switch>
                {/* put most specific routes at top (Switch tag facilitates this) */}
                <Route path="/create" component={CreateGame}/>
                <Route path="/join" component={JoinGame}/>
                <Route path="/vote" component={Vote}/>
                <Route path="/results" component={Results}/>
                <Route path="/" component={Welcome}/>
              </Switch>
            </div>
          </BrowserRouter>
        </div>
      </Provider>
    );
  }
}

export default App;
