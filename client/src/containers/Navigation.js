import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import { Link } from 'react-router-dom';

import './App.css';

class Navigation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
    };
  }

  render() {
    const { location } = this.props;
    const currentPath = location.pathname;

    // helper to check if current path should be highlighted
    const highlight = (path, link, equals) => {
      if (equals) {
        return path === link ? 'active' : null;
      }
      return path.includes(link) ? 'active' : null;
    };

    return (
      <div className="app bot20">
        <Navbar bg="light">
          <Container>
            <Link to="/" className="navbar-brand">
              <img
                src={`${process.env.PUBLIC_URL}/intent.svg`}
                width="30"
                height="30"
                className="d-inline-block align-top"
              />
            </Link>
            <Nav className="mr-auto">
              <Link
                to="/"
                className={`nav-link ${highlight(currentPath, '/', true)}`}
              >
                Home
              </Link>
            </Nav>
          </Container>
        </Navbar>
      </div>
    );
  }
}
Navigation.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
};

function mapStateToProps(state) {
  return {
    loggedIn: state.login,
  };
}
function mapDispatchToProps(dispatch) {
  return {};
}
export default connect(mapStateToProps, mapDispatchToProps)(Navigation);
