/* eslint max-len: "off" */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Select from 'react-select';

import _ from 'lodash';

import { updateFlash } from '../actions/FlashActions';
import callEndpoint from '../utils/Endpoints';
import { KIND, TAG } from '../utils/Constants';

import Loading from '../components/Loading';

class Tagger extends Component {
  constructor(props) {
    super(props);

    this.state = {
      trainingExampleId: this.props.match.params.trainingExampleId,
      trainingExample: {},
      completed: false,
      next: null,
      prev: null,
    };
  }

  // get example and prev / next example
  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.match.params.trainingExampleId !==
      this.props.match.params.trainingExampleId
    ) {
      this.loadData();
    }
  }

  loadData() {
    return Promise.all([
      callEndpoint(
        {
          kind: KIND.trainingExample,
          type: 'get',
          data: {
            id: this.props.match.params.trainingExampleId,
          },
        },
        this.props.flash,
        true
      ),
      callEndpoint(
        {
          kind: KIND.trainingExample,
          type: 'next',
          data: {
            id: this.props.match.params.trainingExampleId,
          },
        },
        this.props.flash,
        true
      ),
      callEndpoint(
        {
          kind: KIND.trainingExample,
          type: 'prev',
          data: {
            id: this.props.match.params.trainingExampleId,
          },
        },
        this.props.flash,
        true
      ),
    ])
      .then(([trainingExample, next, prev]) => {
        this.setState({
          trainingExample: {
            ...trainingExample,
            tags: trainingExample.tags || [...trainingExample.guess],
          },
          completed: trainingExample.tags,
          next: _.get(next, 'id'),
          prev: _.get(prev, 'id'),
        });
      })
      .catch(err => {
        this.setState({
          trainingExample: {},
        });
      });
  }

  setTags({ tags }) {
    return callEndpoint(
      {
        kind: KIND.trainingExample,
        type: 'tag',
        data: {
          id: this.props.match.params.trainingExampleId,
          tags,
        },
      },
      this.props.flash
    )
      .then(trainingExample => {
        this.setState({
          trainingExample,
        });

        if (this.state.next) {
          this.props.history.push(`/tag/${this.state.next}`);
        }
      })
      .catch(() => {});
  }

  escalate() {
    return callEndpoint(
      {
        kind: KIND.trainingExample,
        type: 'escalate',
        data: {
          id: this.props.match.params.trainingExampleId,
        },
      },
      this.props.flash
    )
      .then(trainingExample => {
        console.log('yo');
        console.log(trainingExample);
        this.setState({
          trainingExample: {
            ...trainingExample,
            tags: trainingExample.tags || [...trainingExample.guess],
          },
        });
        if (this.state.next) {
          this.props.history.push(`/tag/${this.state.next}`);
        }
      })
      .catch(() => {});
  }

  render() {
    if (_.isEmpty(this.state.trainingExample)) {
      return (
        <Row className="top40">
          <Col className="centered">
            <Loading size={40} />
          </Col>
        </Row>
      );
    }

    const trainingExample = this.state.trainingExample;
    const { tokens, tags } = trainingExample;

    let message = null;
    if (trainingExample.escalated) {
      message = (
        <Alert variant="warning">This example has been escalated</Alert>
      );
    } else if (this.state.completed) {
      message = (
        <Alert variant="success">This example has already been tagged.</Alert>
      );
    } else {
      message = (
        <Alert variant="secondary">
          This example needs to be tagged - current tags are a guess.
        </Alert>
      );
    }

    console.log('here');
    console.log(tags);

    const tokenBox = index => (
      <div key={index} className="flexVerticalCenter top20 left10">
        <div className="centered">{tokens[index]}</div>
        <div className="top5" style={{ width: 110 }}>
          <Select
            value={{ value: tags[index], label: tags[index].slice(0, 6) }}
            options={_.map(TAG, tag => ({
              value: tag,
              label: tag.slice(0, 6),
            }))}
            onChange={({ value }) => {
              const updatedTrainingExample = { ...trainingExample };
              updatedTrainingExample.tags[index] = value;
              this.setState({
                trainingExample: updatedTrainingExample,
              });
            }}
          />
        </div>
      </div>
    );

    return (
      <section className="app">
        <div className="bot20 spaceBetween">
          <div>
            {this.state.prev ? (
              <Button
                variant="outline-secondary"
                size="sm"
                className="arrowButton"
                onClick={() =>
                  this.props.history.push(`/tag/${this.state.prev}`)
                }
              >
                ‹
              </Button>
            ) : null}
            {this.state.next ? (
              <Button
                variant="outline-secondary"
                size="sm"
                className="arrowButton left10"
                onClick={() =>
                  this.props.history.push(`/tag/${this.state.next}`)
                }
              >
                ›
              </Button>
            ) : null}
          </div>
        </div>
        <Row>
          <Col md={12}>
            <Container className="app">
              {message}
              <div className="left10">
                Original Text: {this.state.trainingExample.original}
              </div>
              <div className="flexStartCenter flexWrap">
                {_.map(this.state.trainingExample.tokens, (token, index) =>
                  tokenBox(index)
                )}
              </div>
              <div className="top40">
                <Button
                  variant="primary"
                  className="left10"
                  onClick={() =>
                    this.setTags({
                      tags,
                    })
                  }
                >
                  DONE
                </Button>
                <Button
                  variant="warning"
                  className="left10"
                  onClick={() => this.escalate()}
                >
                  ESCALATE
                </Button>
              </div>
            </Container>
          </Col>
        </Row>
      </section>
    );
  }
}
Tagger.propTypes = {
  flash: PropTypes.func.isRequired,
};
function mapDispatchToProps(dispatch) {
  return {
    flash: f => dispatch(updateFlash(f)),
  };
}
export default connect(null, mapDispatchToProps)(Tagger);
