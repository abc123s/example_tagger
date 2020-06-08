import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import { connect } from 'react-redux';
import { updateFlash } from '../actions/FlashActions';

class Flash extends Component {
  componentWillUpdate(nextProps) {
    // reset flash if we have changed pages
    if (
      nextProps.location.pathname !== this.props.location.pathname &&
      nextProps.flash.body &&
      nextProps.location.search.indexOf('flash') < 0
    ) {
      this.props.dismissFlash();
      clearTimeout(this.timer);
    } else if (
      nextProps.flash.body !== this.props.flash.body &&
      !this.props.flash.body
    ) {
      this.timer = setTimeout(() => this.props.dismissFlash(), 8000);
    }

    // also manage scrolling here too
    if (nextProps.history.action !== 'POP') {
      window.scrollTo(0, 0);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  render() {
    if (this.props.flash.body) {
      return (
        <section className="common">
          <Row>
            <Col md={12}>
              <Alert
                variant={this.props.flash.status < 400 ? 'success' : 'danger'}
              >
                {this.props.flash.body}
              </Alert>
            </Col>
          </Row>
        </section>
      );
    }
    return null;
  }
}
Flash.propTypes = {
  flash: PropTypes.shape({
    status: PropTypes.number,
    body: PropTypes.string,
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
  dismissFlash: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    flash: state.flash || {},
  };
}
function mapDispatchToProps(dispatch) {
  return {
    dismissFlash: () => dispatch(updateFlash({})),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Flash);
