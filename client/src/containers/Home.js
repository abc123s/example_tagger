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
import { KIND } from '../utils/Constants';

const examples = [
  {
    title: 'Basic Example',
    note:
      'There are 5 tags, QTY, UNIT, NAME (ingredient), COMMENT (prep) and OTHER. The first four tags have two variants: B-[TAG], indicating the beginning of the tagged phrase, and I-[TAG], indicating the interior of the tagged phrase.',
    original: '1 15.5 oz can black beans, rinsed and drained',
    tokens: [
      '1',
      '15.5',
      'oz',
      'can',
      'black',
      'beans',
      ',',
      'rinsed',
      'and',
      'drained',
    ],
    tags: [
      'B-QTY',
      'B-UNIT',
      'I-UNIT',
      'I-UNIT',
      'B-NAME',
      'I-NAME',
      'OTHER',
      'B-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
    ],
  },
  {
    title: 'Quantity Handling 1: Fractions',
    note:
      'Fractions will be split into pieces. Include all pieces of the fraction in the quantity, including the slashes.',
    original: '1 1/2 cups all-purpose flour',
    tokens: ['1', '1', '/', '2', 'cups', 'all-purpose', 'flour'],
    tags: ['B-QTY', 'I-QTY', 'I-QTY', 'I-QTY', 'B-UNIT', 'B-NAME', 'I-NAME'],
  },
  {
    title: 'Quantity Handling 2: Quantity ranges',
    note:
      'When a range of quantities is provided, make sure to tag each quantity as a separate phrase (i.e. each quantity should start with a B- TAG). Any intervening words should be tagged as OTHER.',
    original: '1 1/2 to 2 cups all-purpose flour',
    tokens: ['1', '1', '/', '2', 'to', '2', 'cups', 'all-purpose', 'flour'],
    tags: [
      'B-QTY',
      'I-QTY',
      'I-QTY',
      'I-QTY',
      'OTHER',
      'B-QTY',
      'B-UNIT',
      'B-NAME',
      'I-NAME',
    ],
  },
  {
    title: 'Name Handling 1: What counts as name? (1/4)',
    note:
      "Adjectives that describe a property of the ingredient are generally part of it's name if that adjective changes the item you would buy at the grocery store.",
    original: '1 tbsp fresh ginger',
    tokens: ['1', 'tbsp', 'fresh', 'ginger'],
    tags: ['B-QTY', 'B-UNIT', 'B-NAME', 'I-NAME'],
  },
  {
    title: 'Name Handling 2: What counts as name? (2/4)',
    note:
      'Adjectives that describe an action done to the ingredient are generally comments, even if they occur before the ingredient name.',
    original: '1 tbsp diced ginger',
    tokens: ['1', 'tbsp', 'diced', 'ginger'],
    tags: ['B-QTY', 'B-UNIT', 'B-COMMENT', 'B-NAME'],
  },
  {
    title: 'Name Handling 3: What counts as name? (3/4)',
    note:
      'Adjectives that describe a property of the ingredient that do not modify the item you buy at the grocery store are usually other.',
    original: '1 crisp apple',
    tokens: ['1', 'crisp', 'apple'],
    tags: ['B-QTY', 'OTHER', 'B-NAME'],
  },
  {
    title: 'Name Handling 4: What counts as name? (4/4)',
    note:
      'Words that describe the size or form-factor of an ingredient are usually actually units (e.g. medium, filet).',
    original: '1 medium apple',
    tokens: ['1', 'medium', 'apple'],
    tags: ['B-QTY', 'B-UNIT', 'B-NAME'],
  },
  {
    title: 'Name Handling 5: Multiple ingredients',
    note:
      'Examples with multiple ingredients in one line should be tagged to distinguish between each ingredient when tagged. Each separate ingredient should begin with a new B-NAME tag.',
    original: 'Salt and black pepper',
    tokens: ['Salt', 'and', 'black', 'pepper'],
    tags: ['B-NAME', 'OTHER', 'B-NAME', 'I-NAME'],
  },
  {
    title: 'Comment Handling 1: What counts as comment?',
    note:
      'Quantity-like and unit-like strings that are a part of the prep should be tagged as comment.',
    original: '1 cup green pepper, 1/4 cup sliced into 1/2-inch pieces',
    tokens: [
      '1',
      'cup',
      'green',
      'pepper',
      ',',
      '1',
      '/',
      '4',
      'cup',
      'sliced',
      'into',
      '1',
      '/',
      '2-inch',
      'pieces',
    ],
    tags: [
      'B-QTY',
      'B-UNIT',
      'B-NAME',
      'I-NAME',
      'OTHER',
      'B-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
    ],
  },
  {
    title: 'Comment Handling 2: Alternatives',
    note: 'Alternative ingredients should be tagged as comments.',
    original: '1 tsp red pepper, or paprika',
    tokens: ['1', 'tsp', 'red', 'pepper', ',', 'or', 'paprika'],
    tags: [
      'B-QTY',
      'B-UNIT',
      'B-NAME',
      'I-NAME',
      'OTHER',
      'B-COMMENT',
      'I-COMMENT',
    ],
  },
  {
    title: 'Comment Handling 3: Punctuation',
    note:
      'Commas that separate name and comment should be tagged as OTHER, but commas inside a comment should be tagged as COMMENT. The same logic applies to other punctuation (e.g. interior punctuation should generally be included).',
    original: '1 cup green pepper, cored, seeded and diced',
    tokens: [
      '1',
      'cup',
      'green',
      'pepper',
      ',',
      'cored',
      ',',
      'seeded',
      'and',
      'diced',
    ],
    tags: [
      'B-QTY',
      'B-UNIT',
      'B-NAME',
      'I-NAME',
      'OTHER',
      'B-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
      'I-COMMENT',
    ],
  },
];

function ExampleBox({ example }) {
  const { title, note, original, tokens, tags } = example;

  const tokenBox = index => (
    <div key={index} className="flexVerticalCenter top20 left10">
      <div className="centered">{tokens[index]}</div>
      <div className="top5" style={{ width: 110 }}>
        <Select
          value={{ value: tags[index], label: tags[index].slice(0, 6) }}
          options={[{ value: tags[index], label: tags[index].slice(0, 6) }]}
        />
      </div>
    </div>
  );

  return (
    <div className="bot40">
      <Alert variant="secondary" className="left10 bot20">
        <Alert.Heading>{title}</Alert.Heading>
        <hr />
        {note}
      </Alert>
      <div className="left10">Original Text: {original}</div>
      <div className="flexStartCenter flexWrap">
        {_.map(tokens, (token, index) => tokenBox(index))}
      </div>
    </div>
  );
}

class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      nextTrainingExample: null,
    };
  }

  loadData() {
    callEndpoint(
      {
        kind: KIND.trainingExample,
        type: 'nextUntagged',
        data: {
          id: 0,
        },
      },
      this.props.flash,
      true
    )
      .then(nextUntaggedTrainingExample => {
        this.setState({
          nextTrainingExample: _.get(nextUntaggedTrainingExample, 'id'),
        });
      })
      .catch(() => {});
  }

  // get example and prev / next example
  componentDidMount() {
    this.loadData();
  }

  render() {
    return (
      <section className="app">
        <Row>
          <Col md={12}>
            <Container className="app">
              <div className="top40">
                {_.map(examples, example => (
                  <ExampleBox example={example} />
                ))}
                <Button
                  variant="primary"
                  className="left10 bot40"
                  onClick={() => {
                    if (this.state.nextTrainingExample) {
                      this.props.history.push(
                        `/tag/${this.state.nextTrainingExample}`
                      );
                    } else {
                      alert('All training examples tagged...');
                    }
                  }}
                >
                  START TAGGING
                </Button>
              </div>
            </Container>
          </Col>
        </Row>
      </section>
    );
  }
}
Home.propTypes = {
  flash: PropTypes.func.isRequired,
};
function mapDispatchToProps(dispatch) {
  return {
    flash: f => dispatch(updateFlash(f)),
  };
}
export default connect(null, mapDispatchToProps)(Home);
