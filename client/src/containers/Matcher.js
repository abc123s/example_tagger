/* eslint max-len: "off" */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Accordion from 'react-bootstrap/Accordion';
import Creatable from 'react-select/creatable';
import Select from 'react-select';

import _ from 'lodash';

import { updateFlash } from '../actions/FlashActions';
import callEndpoint from '../utils/Endpoints';
import { KIND, TAG } from '../utils/Constants';
import {
  INGREDIENT_LIST,
  FULL_INGREDIENT_LIST,
  INGREDIENT_UNITS,
} from '../utils/IngredientDictionary';

import Loading from '../components/Loading';

function getUnitId({ id, type, unitWord }) {
  return `${id}-${type}-${unitWord}`;
}

/**
 * Minimize display of parenthetical annotations
 * e.g. make ingredient annotations small and gray
 * @param {string} s
 * @param {function} spanGenerator - (s, k) => node, where s is string and k is key
 * @param {bool} trailingSpace
 */
function minimizeAnnotations(s, spanGenerator, trailingSpace = false) {
  let leftCounter = 0;
  let accString = '';

  const result = [];
  _.forEach(s, (char, i) => {
    if (char === '(') {
      if (leftCounter === 0) {
        result.push(accString);
        accString = '(';
      } else {
        accString += char;
      }
      leftCounter += 1;
    } else if (char === ')') {
      leftCounter -= 1;
      if (leftCounter === 0) {
        accString += ')';
        result.push(spanGenerator(accString, `${accString}-${i}`));
        accString = '';
      } else {
        accString += char;
      }
    } else {
      accString += char;
    }
  });
  result.push(accString);

  if (trailingSpace) {
    return [...result, ' '];
  }
  return result;
}

class Ingredient extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // for react-select component
      ingredientOptions: [
        {
          value: -1,
          label: 'NO MATCH',
        },
        ..._.map(INGREDIENT_LIST, v => ({
          value: v.id,
          label: v.display,
        })),
      ],
    };
  }

  // required for perf: prevents unnecessary rerenders
  shouldComponentUpdate(nextProps) {
    if (
      nextProps.index !== this.props.index ||
      !_.isEqual(nextProps.ingredient, this.props.ingredient) ||
      nextProps.quantityError !== this.props.quantityError ||
      nextProps.lockDeletionWarning !== this.props.lockDeletionWarning ||
      nextProps.lockEditWarning !== this.props.lockEditWarning ||
      !_.isEqual(nextProps.prepStrings, this.props.prepStrings)
    ) {
      return true;
    }
    return false;
  }

  // helper: convert a prep string to a react-select option
  prepConverter(prep) {
    return { value: prep, label: prep };
  }

  render() {
    const {
      ingredient: { quantity, unit, ingredient, prep, comment },
      index,
      updateIngredient,
      deleteIngredient,
      toggleCard,
      quantityError,
      unitError,
      lockDeletionWarning,
      lockEditWarning,
      unsetDeletionWarning,
      unsetEditWarning,
      prepStrings,
    } = this.props;

    let selectedIngredient = {
      value: -1,
      label: 'NO MATCH',
    };
    let unitOptions = [];
    let selectedUnit = null;
    let mainSpan = 'NO MATCH';
    if (ingredient) {
      const updatedIngredient = FULL_INGREDIENT_LIST[ingredient.id];

      selectedIngredient = {
        value: updatedIngredient.id,
        label: updatedIngredient.display,
      };
      unitOptions = _.map(INGREDIENT_UNITS[ingredient.id], v => ({
        value: getUnitId(v),
        label: v.display,
      }));
      selectedUnit = {
        value: getUnitId(unit),
        label: unit.display,
      };

      const minimizeSpanGenerator = (s, k) => (
        <span key={k} className="lightGray mini">
          {s}
        </span>
      );
      mainSpan = quantity
        ? _.flatten([
            `${quantity} `,
            minimizeAnnotations(unit.display, minimizeSpanGenerator, true),
            minimizeAnnotations(
              updatedIngredient.display,
              minimizeSpanGenerator
            ),
          ])
        : minimizeAnnotations(updatedIngredient.display, minimizeSpanGenerator);
    }

    const prepSpan = prep ? <span className="purple">{`${prep}`}</span> : null;
    const commentSpan = comment ? (
      <span className="success">{`${prep ? ', ' : ''}${comment}`}</span>
    ) : null;
    const header = (
      <div className="spaceBetween">
        <div>
          <div className="main">{mainSpan}</div>
          <div>
            {prepSpan}
            {commentSpan}
          </div>
        </div>
        <button
          className="trashIcon"
          onClick={event => {
            event.stopPropagation();
            if (lockDeletionWarning) {
              if (
                window.confirm(
                  "Warning: you're about to delete an ingredient that is already associated with an instruction. Please be sure to review the text!"
                )
              ) {
                unsetDeletionWarning();
                deleteIngredient(index);
              }
            } else {
              deleteIngredient(index);
            }
          }}
        >
          <span className="fa fa-trash" />
        </button>
      </div>
    );

    return (
      <Card border={quantityError || unitError ? 'danger' : null}>
        <Accordion.Toggle
          as={Card.Header}
          eventKey={index}
          onClick={() => toggleCard(index)}
        >
          {header}
        </Accordion.Toggle>
        <Accordion.Collapse eventKey={index}>
          <Card.Body>
            <Form
              onSubmit={e => {
                e.preventDefault();
              }}
            >
              <Form.Group>
                <Form.Row>
                  <Col md={12}>
                    <Select
                      isSearchable
                      autoFocus
                      value={selectedIngredient}
                      options={this.state.ingredientOptions}
                      onChange={({ value }) =>
                        updateIngredient(index, 'ingredient', value)
                      }
                      onFocus={() => {
                        if (lockEditWarning) {
                          window.alert(
                            "Warning: you're editing an ingredient that is already associated in an instruction. Please be sure to review its usage!"
                          );
                          unsetEditWarning();
                        }
                      }}
                    />
                  </Col>
                </Form.Row>
              </Form.Group>
              <Form.Group>
                {quantity === false ? (
                  <Form.Row>
                    <Col md={12}>
                      <div className="spaceBetween">
                        <Form.Label className="lightGray">
                          (no quantity)
                        </Form.Label>
                        <button
                          className="noneIcon"
                          disabled={!ingredient}
                          onClick={() =>
                            updateIngredient(index, 'quantity', '')
                          }
                        >
                          <span className="fa fa-plus" />
                        </button>
                      </div>
                    </Col>
                  </Form.Row>
                ) : (
                  <Form.Row>
                    <Col md={3}>
                      <Form.Label>Quantity</Form.Label>
                      <Form.Control
                        value={quantity}
                        onChange={e =>
                          updateIngredient(index, 'quantity', e.target.value)
                        }
                        isInvalid={quantityError}
                      />
                    </Col>
                    <Col md={9}>
                      <div className="spaceBetween">
                        <Form.Label>Unit</Form.Label>
                        <div>
                          <button
                            tabIndex="-1"
                            className="noneIcon"
                            type="button"
                            onClick={() =>
                              updateIngredient(index, 'quantity', false)
                            }
                          >
                            <span className="fa fa-ban" /> quantity
                          </button>
                        </div>
                      </div>
                      <Select
                        isSearchable
                        styles={{
                          control: (provided, state) => {
                            return {
                              ...provided,
                              borderColor: unitError ? '#b94a48' : '#aaa',
                            };
                          },
                        }}
                        value={selectedUnit}
                        options={unitOptions}
                        onChange={({ value }) =>
                          updateIngredient(index, 'unit', value)
                        }
                      />
                    </Col>
                  </Form.Row>
                )}
              </Form.Group>
            </Form>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  }
}

const CLEANING = {
  quantity: v => (v === false ? v : Number(v)),
  prep: v => (!v || v.trim() === '' ? null : v.trim()),
  comment: v => (!v || v.trim() === '' ? null : v.trim()),
};

class Matcher extends Component {
  constructor(props) {
    super(props);

    this.state = {
      trainingExampleId: this.props.match.params.trainingExampleId,
      trainingExample: {},
      activeAccordionCard: '',
      completed: false,
      quantityErrors: [],
      unitErrors: [],
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
            ingredients: trainingExample.ingredients || [
              ...(trainingExample.matchGuess || []),
            ],
          },
          activeAccordionCard:
            (trainingExample.ingredients || trainingExample.matchGuess || [])
              .length - 1,
          quantityErrors: _.map(
            trainingExample.ingredients || trainingExample.matchGuess || [],
            ({ quantity }) => !quantity && quantity !== false
          ),
          unitErrors: _.map(
            trainingExample.ingredients || trainingExample.matchGuess || [],
            ({ quantity, unit }) => !unit && quantity !== false
          ),
          tagged: (trainingExample.tags || []).length,
          completed: (trainingExample.ingredients || []).length,
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

  addIngredient() {
    const firstValidIngredient = _.minBy(_.values(INGREDIENT_LIST), 'id');

    const newIngredient = {
      quantity: '1',
      unit: INGREDIENT_UNITS[firstValidIngredient.id][0],
      ingredient: firstValidIngredient,
      prep: '',
      comment: '',
    };

    this.setState({
      activeAccordionCard: this.state.trainingExample.ingredients.length,
      trainingExample: {
        ...this.state.trainingExample,
        ingredients: [...this.state.trainingExample.ingredients, newIngredient],
      },
      quantityErrors: [...this.state.quantityErrors, false],
      unitErrors: [...this.state.unitErrors, false],
    });
  }

  updateIngredient(index, k, v) {
    const trainingExample = {
      ...this.state.trainingExample,
    };
    const quantityErrors = [...this.state.quantityErrors];
    const unitErrors = [...this.state.unitErrors];

    if (k === 'ingredient') {
      if (v === -1) {
        trainingExample.ingredients[index] = {
          quantity: false,
          unit: null,
          ingredient: null,
          prep: null,
        };
      } else {
        const newIngredient = _.find(INGREDIENT_LIST, ({ id }) => id === v);
        let newUnit = INGREDIENT_UNITS[newIngredient.id][0];

        // attempt to match with previous unit
        // only look for identical 'display' string
        const previousUnit = _.get(trainingExample.ingredients[index], 'unit');
        if (previousUnit) {
          const sameDisplay = _.findIndex(
            INGREDIENT_UNITS[newIngredient.id],
            u => u.display === previousUnit.display
          );
          if (sameDisplay > -1) {
            newUnit = INGREDIENT_UNITS[newIngredient.id][sameDisplay];
          }
        }

        trainingExample.ingredients[index] = {
          ...trainingExample.ingredients[index],
          ingredient: newIngredient,
          unit: newUnit,
        };
      }
    } else if (k === 'unit') {
      unitErrors[index] = !v;

      const prevIngredient = _.get(
        trainingExample.ingredients[index],
        'ingredient'
      );
      const newUnit = _.find(
        INGREDIENT_UNITS[prevIngredient.id],
        unit => getUnitId(unit) === v
      );
      trainingExample.ingredients[index] = {
        ...trainingExample.ingredients[index],
        unit: newUnit,
      };
    } else {
      // set errors as appropriate
      if (k === 'quantity') {
        quantityErrors[index] = !(v === false || v.trim());
      }

      trainingExample.ingredients[index] = {
        ...trainingExample.ingredients[index],
        [k]: v,
      };
    }

    this.setState({ trainingExample, quantityErrors, unitErrors });
  }

  deleteIngredient(index) {
    // if it's locked, we must splice out brackets and associated ingredients
    this.setState({
      trainingExample: {
        ...this.state.trainingExample,
        ingredients: _.filter(
          this.state.trainingExample.ingredients,
          (_, k) => k !== index
        ),
      },
      quantityErrors: _.filter(
        this.state.quantityErrors,
        (_, k) => k !== index
      ),
      unitErrors: _.filter(this.state.unitErrors, (_, k) => k !== index),
      activeAccordionCard: '',
    });
  }

  setIngredients({ ingredients: rawIngredients }) {
    const ingredients = [];
    const quantityErrors = [];
    const unitErrors = [];
    // clean and check errors for each ingredient
    _.forEach(rawIngredients, ingredient => {
      const cleanIngredient = _.mapValues(ingredient, (v, k) =>
        CLEANING[k] ? CLEANING[k](v) : v
      );
      if (
        cleanIngredient.quantity === false ||
        (_.isFinite(cleanIngredient.quantity) && cleanIngredient.quantity > 0)
      ) {
        quantityErrors.push(false);
      } else {
        quantityErrors.push(true);
      }

      if (cleanIngredient.quantity && !cleanIngredient.unit) {
        unitErrors.push(true);
      } else {
        unitErrors.push(false);
      }

      ingredients.push(cleanIngredient);
    });

    if (!_.some(quantityErrors) && !_.some(unitErrors)) {
      return callEndpoint(
        {
          kind: KIND.trainingExample,
          type: 'match',
          data: {
            id: this.props.match.params.trainingExampleId,
            ingredients,
          },
        },
        this.props.flash
      )
        .then(trainingExample => {
          this.setState({
            trainingExample,
          });

          if (this.state.next) {
            this.props.history.push(`/match/${this.state.next}`);
          }
        })
        .catch(() => {});
    } else {
      this.setState({ quantityErrors, unitErrors });
    }
  }

  escalate() {
    return callEndpoint(
      {
        kind: KIND.trainingExample,
        type: 'escalateMatch',
        data: {
          id: this.props.match.params.trainingExampleId,
        },
      },
      this.props.flash
    )
      .then(trainingExample => {
        this.setState({
          trainingExample: {
            ...trainingExample,
            ingredients: trainingExample.ingredients || [
              ...(trainingExample.matchGuess || []),
            ],
          },
        });
        if (this.state.next) {
          this.props.history.push(`/match/${this.state.next}`);
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
    const { tokens, tags, ingredients } = trainingExample;

    let message = null;
    if (trainingExample.matchEscalated) {
      message = (
        <Alert variant="warning">This example has been escalated</Alert>
      );
    } else if (this.state.completed) {
      message = (
        <Alert variant="success">This example has already been matched.</Alert>
      );
    } else if (!this.state.tagged) {
      message = (
        <Alert variant="danger">
          This example needs to be tagged before it can be matched!
        </Alert>
      );
    } else {
      message = (
        <Alert variant="secondary">
          This example needs to be matched - current ingredients are a guess.
        </Alert>
      );
    }

    const tagColors = {
      [TAG.bQty]: '#F57C00',
      [TAG.iQty]: '#FFB300',
      [TAG.bUnit]: '#558B2F',
      [TAG.iUnit]: '#8BC34A',
      [TAG.bName]: '#1565C0',
      [TAG.iName]: '#64B5F6',
      [TAG.bComment]: '#6A1B9A',
      [TAG.iComment]: '#BA68C8',
      [TAG.other]: '#9E9E9E',
    };

    const customStyles = {
      option: (provided, state) => {
        const selected = state.data.value;

        return {
          ...provided,
          backgroundColor: tagColors[state.data.value],
          color: selected.slice(0, 1) === 'B' ? 'white' : 'black',
          fontWeight: 'bold',
        };
      },
      singleValue: (provided, state) => {
        const selected = state.getValue()[0].value;
        return {
          ...provided,
          backgroundColor: tagColors[selected],
          color: selected.slice(0, 1) === 'B' ? 'white' : 'black',
          fontWeight: 'bold',
        };
      },
      control: (provided, state) => {
        const selected = state.getValue()[0].value;
        return {
          ...provided,
          backgroundColor: tagColors[selected],
          color: selected.slice(0, 1) === 'B' ? 'white' : 'black',
          fontWeight: 'bold',
        };
      },
    };

    const tokenBox = index => (
      <div key={index} className="flexVerticalCenter top20 left10">
        <div
          className="centered"
          style={{
            fontWeight: 'bold',
            color: tagColors[tags[index]],
          }}
        >
          {tokens[index]}
        </div>
        <div className="top5" style={{ width: 110 }}>
          <Select
            styles={customStyles}
            value={{ value: tags[index], label: tags[index].slice(0, 6) }}
            isDisabled
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
                  this.props.history.push(`/match/${this.state.prev}`)
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
                  this.props.history.push(`/match/${this.state.next}`)
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
                Original Text: {trainingExample.original} <br />
                Source:{' '}
                <a href={trainingExample.source}>{trainingExample.source}</a>
              </div>
              <div className="flexStartCenter flexWrap">
                {_.map(this.state.trainingExample.tokens, (token, index) =>
                  tokenBox(index)
                )}
              </div>
              <div className="top20 left10">
                <h3>Matched Ingredients:</h3>
                <Accordion activeKey={this.state.activeAccordionCard}>
                  {_.map(
                    this.state.trainingExample.ingredients,
                    (ingredient, index) => {
                      return (
                        <Ingredient
                          ingredient={ingredient}
                          updateIngredient={(i, k, v) =>
                            this.updateIngredient(i, k, v)
                          }
                          deleteIngredient={i => this.deleteIngredient(i)}
                          key={ingredient.id}
                          index={index}
                          quantityError={this.state.quantityErrors[index]}
                          unitError={this.state.unitErrors[index]}
                          toggleCard={i => {
                            this.setState({
                              activeAccordionCard:
                                this.state.activeAccordionCard === i ? '' : i,
                            });
                          }}
                          unsetEditWarning={() =>
                            this.setState({ lockEditWarning: false })
                          }
                        />
                      );
                    }
                  )}
                </Accordion>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={!this.state.tagged}
                  onClick={() => this.addIngredient()}
                  className="right10"
                >
                  Add Matched Ingredient
                </Button>
              </div>
              <div className="top40">
                <Button
                  variant="primary"
                  className="left10"
                  disabled={!this.state.tagged}
                  onClick={() =>
                    this.setIngredients({
                      ingredients,
                    })
                  }
                >
                  DONE
                </Button>
                <Button
                  variant="danger"
                  className="left10"
                  disabled={!this.state.tagged}
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
Matcher.propTypes = {
  flash: PropTypes.func.isRequired,
};
function mapDispatchToProps(dispatch) {
  return {
    flash: f => dispatch(updateFlash(f)),
  };
}
export default connect(null, mapDispatchToProps)(Matcher);
