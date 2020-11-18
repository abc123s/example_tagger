import _ from 'lodash';

var fs = require('fs');

const trainExamples = JSON.parse(
  fs.readFileSync('trainMatchedTrainingExamples.json')
);

const cleanTrainExamples = _.map(trainExamples, ({ original, ingredients }) => {
  return {
    label:
      (ingredients[0] &&
        ingredients[0].ingredient &&
        ingredients[0].ingredient.id) ||
      -1,
    text: original,
  };
});

fs.writeFile(
  'naiveBayesTrain.json',
  JSON.stringify(cleanTrainExamples, null, 2),
  err => {
    if (err) {
      console.log(err);
    }
  }
);

const devExamples = JSON.parse(
  fs.readFileSync('devMatchedTrainingExamples.json')
);

const cleanDevExamples = _.map(devExamples, ({ original, ingredients }) => {
  return {
    label:
      (ingredients[0] &&
        ingredients[0].ingredient &&
        ingredients[0].ingredient.id) ||
      -1,
    text: original,
  };
});

fs.writeFile(
  'naiveBayesDev.json',
  JSON.stringify(cleanDevExamples, null, 2),
  err => {
    if (err) {
      console.log(err);
    }
  }
);
