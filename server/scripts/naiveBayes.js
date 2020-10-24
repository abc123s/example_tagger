import _ from 'lodash';
import { TrainingExample } from '../sequelize/models';
import matchIngredients from './matchIngredients';

var fs = require('fs');

TrainingExample.findAll().then(trainingExamples => {
  const matchedExamples = _.filter(
    trainingExamples,
    ({ ingredients }) => ingredients
  );

  const cleanExamples = _.map(matchedExamples, ({ original, ingredients }) => {
    return {
      label:
        (ingredients[0] &&
          ingredients[0].ingredient &&
          ingredients[0].ingredient.id) ||
        -1,
      text: original,
    };
  });

  console.log('How many unique labels?');
  console.log(_.maxBy(cleanExamples, ({ label }) => label));

  fs.writeFile(
    'naiveBayes.json',
    JSON.stringify(cleanExamples, null, 2),
    function(err) {
      if (err) {
        console.log(err);
      }
    }
  );
});
