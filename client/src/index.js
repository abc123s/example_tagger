import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import Routes from './routes';
import store from './store';
import * as serviceWorker from './serviceWorker';
import 'bootstrap/dist/css/bootstrap.css';

class App extends Component {
  componentWillMount() {}

  render() {
    return (
      <Provider store={store}>
        <Routes />
      </Provider>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
