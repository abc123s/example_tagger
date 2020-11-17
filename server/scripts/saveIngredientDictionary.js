import _ from 'lodash';

import { DISPLAY_INGREDIENT } from 'recipe-display';

const fs = require('fs');

const simpleIngredientDictionary = _.mapValues(
  DISPLAY_INGREDIENT,
  ({ longNameSingular }) => longNameSingular
);

fs.writeFileSync(
  'ingredientDictionary.json',
  JSON.stringify(simpleIngredientDictionary, null, 4)
);
