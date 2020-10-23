import React, { Component } from 'react';
import { Router, Route, Redirect, Switch } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { connect } from 'react-redux';

import Container from 'react-bootstrap/Container';
import Navigation from './containers/Navigation';
import Flash from './containers/Flash';
import Tagger from './containers/Tagger';
import Matcher from './containers/Matcher';
import Home from './containers/Home';

import './containers/App.css';

class Routes extends Component {
  constructor(props) {
    super(props);
    this.state = {
      history: createBrowserHistory(),
    };
  }

  render() {
    return this.props.rehydrated ? (
      <Router history={this.state.history}>
        <div className="app">
          <Route
            path="*"
            render={props => (
              <Navigation {...props} admin={this.props.role === 'admin'} />
            )}
          />

          {/* large container for tagging / matching tasks */}
          <Container fluid>
            <Route path="*" component={Flash} />
            <Switch>
              <Route path="/tag/:trainingExampleId" component={Tagger} />
              <Route path="/match/:trainingExampleId" component={Matcher} />
              <Route path="/" component={Home} />
              <Redirect from="*" to="/" />
            </Switch>
          </Container>
        </div>
      </Router>
    ) : null;
  }
}
Routes.propTypes = {};

function mapStateToProps(state) {
  return {
    rehydrated: state.rehydrated,
  };
}
function mapDispatchToProps(dispatch) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(Routes);
