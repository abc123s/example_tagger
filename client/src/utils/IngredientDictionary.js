import _ from 'lodash';

import { DISPLAY_INGREDIENT, SCRAPER_INGREDIENT_UNIT } from 'recipe-display';

// remove internal ingredients that should not be shown
export const FULL_INGREDIENT_LIST = DISPLAY_INGREDIENT;
export const INGREDIENT_LIST = _.pickBy(
  FULL_INGREDIENT_LIST,
  ({ hide }) => !hide
);
export const FULL_INGREDIENT_UNITS = SCRAPER_INGREDIENT_UNIT;
// remove deprecated units that should no longer be shown
// remove duplicate units (created purely for matching purposes)
export const INGREDIENT_UNITS = _.mapValues(FULL_INGREDIENT_UNITS, units =>
  _.uniqBy(
    _.filter(units, ({ hide }) => !hide),
    ({ display }) => display
  )
);
