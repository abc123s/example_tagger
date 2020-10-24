import _ from 'lodash';
import { TrainingExample } from '../sequelize/models';

TrainingExample.findAll().then(trainingExamples => {
  const matchedExamples = _.filter(
    trainingExamples,
    ({ ingredients }) => ingredients
  );

  console.log(`Grading a total of ${matchedExamples.length} training examples`);
  let correctIngredientMatches = 0;
  let correctMatches = 0;
  const incorrect = [];
  _.forEach(matchedExamples, matchedExample => {
    // more than 1 match is definitely guessed wrong
    if (matchedExample.ingredients.length === 1) {
      const matched = matchedExample.ingredients[0];
      const guess = matchedExample.matchGuess[0];

      if (
        matched.ingredient === guess.ingredient ||
        _.get(matched, 'ingredient.id') === _.get(guess, 'ingredient.id')
      ) {
        correctIngredientMatches += 1;

        if (
          matched.quantity === guess.quantity &&
          (matched.unit === guess.unit ||
            _.get(matched, 'unit.id') === _.get(guess, 'unit.id'))
        ) {
          correctMatches += 1;
        }
      } else {
        incorrect.push(matchedExample);
      }
    }
  });

  console.log(`Ingredients correct: ${correctIngredientMatches}`);
  console.log(`Everything correct: ${correctMatches}`);
  console.log('Sample Incorrect:');
  _.forEach(
    _.sampleSize(incorrect, 20),
    ({ original, ingredients, matchGuess }) => {
      console.log('*******');
      console.log(original);
      console.log(ingredients[0]);
      console.log(matchGuess[0]);
    }
  );
});
