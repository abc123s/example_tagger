import _ from 'lodash';

import { DISPLAY_INGREDIENT } from 'recipe-display';

const fs = require('fs');

function extractIngredientNameFromExample(example) {
  return _.filter(example.tokens, (token, index) =>
    _.includes(example.tags[index], 'NAME')
  ).join(' ');
}

const trainingExamples = JSON.parse(
  fs.readFileSync('trainMatchedTrainingExamples.json')
);

const trainingExamplesByLabel = _.groupBy(
  trainingExamples,
  example =>
    example.ingredients[0].ingredient && example.ingredients[0].ingredient.id
);

// examples with the full ingredient phrase (e.g. 1 cup whole milk)
// as positive and negative examples
const fullIngredientPhraseTripletExamples = [];

// examples with only the ingredient name (e.g. whole milk)
// as positive and negative examples
const ingredientNameOnlyTripletExamples = [];

// generate examples
_.forEach(trainingExamplesByLabel, (examples, label) => {
  if (label !== 'null') {
    const matchedIngredient = DISPLAY_INGREDIENT[label];

    // related ingredients in ingredient dictionary (based on ingredient category)
    const relatedIngredients = _.chain(DISPLAY_INGREDIENT)
      .filter(
        ({ id, ingredientCategory }) =>
          id !== matchedIngredient.id &&
          ingredientCategory === matchedIngredient.ingredientCategory
      )
      .map(({ id }) => id)
      .value();

    // similar ingredients in ingredient dictionary (based on overlapping names)
    const similarIngredients = _.chain(DISPLAY_INGREDIENT)
      .filter(({ id, longNameSingular }) => {
        return (
          id !== matchedIngredient.id &&
          _.intersection(
            longNameSingular.split(' '),
            matchedIngredient.longNameSingular.split(' ')
          ).length
        );
      })
      .map(({ id }) => id)
      .value();

    const anchor = matchedIngredient.longNameSingular;

    const examplesWithOtherLabels = _.chain(trainingExamplesByLabel)
      .omit(label)
      .values()
      .flatten()
      .value();

    const examplesWithRelatedLabels = _.chain(trainingExamplesByLabel)
      .pick(relatedIngredients)
      .values()
      .flatten()
      .value();

    const examplesWithSimilarLabels = _.chain(trainingExamplesByLabel)
      .pick(similarIngredients)
      .values()
      .flatten()
      .value();

    _.forEach(examples, example => {
      const fullIngredientPositive = example.original;
      const ingredientNameOnlyPositive = extractIngredientNameFromExample(
        example
      );

      // select 5 random negatives
      const randomNegativeExamples = _.sampleSize(examplesWithOtherLabels, 5);
      _.forEach(randomNegativeExamples, negativeExample => {
        const fullIngredientNegative = negativeExample.original;
        const ingredientNameOnlyNegative = extractIngredientNameFromExample(
          example
        );

        fullIngredientPhraseTripletExamples.push([
          anchor,
          fullIngredientPositive,
          fullIngredientNegative,
        ]);

        ingredientNameOnlyTripletExamples.push([
          anchor,
          ingredientNameOnlyPositive,
          ingredientNameOnlyNegative,
        ]);
      });

      // select 5 negatives from examples matched to related ingredients
      const relatedNegativeExamples = _.sampleSize(
        examplesWithRelatedLabels,
        5
      );
      _.forEach(relatedNegativeExamples, negativeExample => {
        const fullIngredientNegative = negativeExample.original;
        const ingredientNameOnlyNegative = extractIngredientNameFromExample(
          example
        );

        fullIngredientPhraseTripletExamples.push([
          anchor,
          fullIngredientPositive,
          fullIngredientNegative,
        ]);

        ingredientNameOnlyTripletExamples.push([
          anchor,
          ingredientNameOnlyPositive,
          ingredientNameOnlyNegative,
        ]);
      });

      // select 5 related ingredients and use them as negative examples as well
      const relatedIngredientNegatives = _.sampleSize(relatedIngredients, 5);
      _.forEach(relatedIngredientNegatives, relatedIngredientId => {
        const relatedIngredient = DISPLAY_INGREDIENT[relatedIngredientId];

        fullIngredientPhraseTripletExamples.push([
          anchor,
          fullIngredientPositive,
          relatedIngredient.longNameSingular,
        ]);

        ingredientNameOnlyTripletExamples.push([
          anchor,
          ingredientNameOnlyPositive,
          relatedIngredient.longNameSingular,
        ]);
      });

      // select 5 negatives from examples matched to similar ingredients
      const similarNegativeExamples = _.sampleSize(
        examplesWithSimilarLabels,
        5
      );
      _.forEach(similarNegativeExamples, negativeExample => {
        const fullIngredientNegative = negativeExample.original;
        const ingredientNameOnlyNegative = extractIngredientNameFromExample(
          example
        );

        fullIngredientPhraseTripletExamples.push([
          anchor,
          fullIngredientPositive,
          fullIngredientNegative,
        ]);

        ingredientNameOnlyTripletExamples.push([
          anchor,
          ingredientNameOnlyPositive,
          ingredientNameOnlyNegative,
        ]);
      });

      // select 5 similar ingredients and use them as negative examples as well
      const similiarIngredientNegatives = _.sampleSize(similarIngredients, 5);
      _.forEach(similiarIngredientNegatives, similarIngredientId => {
        const similarIngredient = DISPLAY_INGREDIENT[similarIngredientId];

        fullIngredientPhraseTripletExamples.push([
          anchor,
          fullIngredientPositive,
          similarIngredient.longNameSingular,
        ]);

        ingredientNameOnlyTripletExamples.push([
          anchor,
          ingredientNameOnlyPositive,
          similarIngredient.longNameSingular,
        ]);
      });
    });
  }
});

fs.writeFileSync(
  'fullIngredientPhraseTripletExamples.json',
  JSON.stringify(fullIngredientPhraseTripletExamples, null, 4)
);

fs.writeFileSync(
  'ingredientNameOnlyTripletExamples.json',
  JSON.stringify(ingredientNameOnlyTripletExamples, null, 4)
);
