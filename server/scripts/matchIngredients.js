import _ from 'lodash';
import similarity from 'string-similarity';

import {
  DISPLAY_INGREDIENT,
  SCRAPER_INGREDIENT_UNIT_MAPPING,
  VOLUME_WORD,
  WEIGHT_WORD,
  UNIT_TYPE,
} from 'recipe-display';

const CHARS_TO_TRIM = '\'",.?!@#$%^&*()-_`~+=:;[]{}|';
function trim(string, charsToTrim = CHARS_TO_TRIM) {
  let pretrimmed = string;
  let trimmed = _.trim(_.trim(pretrimmed), charsToTrim);
  while (trimmed !== pretrimmed) {
    pretrimmed = trimmed;
    trimmed = _.trim(_.trim(pretrimmed), charsToTrim);
  }

  return trimmed;
}

// TODO: take into account annotation information, or add that annotation information into a matching column
function findIngredient({ input, name: rawTaggedName, comment }) {
  let taggedName = _.toLower(rawTaggedName);

  // remove all errant volume and weight words
  taggedName = _.filter(
    _.split(taggedName, ' '),
    taggedNameWord =>
      !_.includes(_.keys(VOLUME_WORD), taggedNameWord) &&
      !_.includes(_.keys(WEIGHT_WORD), taggedNameWord)
  ).join(' ');

  const bestDisplayIngredient = _.maxBy(
    _.values(DISPLAY_INGREDIENT),
    ({ name, longName, match, instruction, pill, ingredient, hide }) => {
      const matchWords = _.chain(match)
        .split(',')
        .map(_.trim);

      // ignore all display ingredients that should not be shown in recipes
      // or display ingredients that are supposed to be hidden
      if (!(instruction || pill || ingredient) || hide) {
        return -1;
      }

      const nameWords = _.split(name, ' ');
      const longNameWords = _.split(longName, ' ');
      const taggedNameWords = _.split(taggedName, ' ');
      const commentWords = _.split(comment, ' ');

      if (taggedName === longName) {
        return 10;
      }

      if (_.includes(taggedName, longName)) {
        return 9;
      }

      if (_.includes(input, longName)) {
        return 8;
      }

      if (
        _.includes(_.uniq([...taggedNameWords, ...commentWords]), longNameWords)
      ) {
        return 7;
      }

      if (taggedName === name) {
        return 6;
      }

      if (_.includes(taggedName, name)) {
        return 5;
      }

      if (_.includes(input, name)) {
        return 4;
      }

      if (_.includes(_.uniq([taggedNameWords, commentWords]), nameWords)) {
        return 3;
      }

      if (_.some(matchWords, matchWord => _.includes(taggedName, matchWord))) {
        return 2;
      }

      if (_.some(matchWords, matchWord => _.includes(input, matchWord))) {
        return 1;
      }

      return _.chain([...matchWords, name])
        .map(matchWord => similarity.compareTwoStrings(taggedName, matchWord))
        .max()
        .value();
    }
  );

  return _.pick(bestDisplayIngredient, [
    'id',
    'instructionName',
    'pillName',
    'name',
    'longName',
    'display',
  ]);
}

function matchToVolume(unit) {
  let normalizedUnit = trim(_.toLower(unit));
  if (_.last(normalizedUnit) === 's') {
    normalizedUnit = normalizedUnit.slice(-1);
  }

  return (
    _.includes(_.keys(VOLUME_WORD), normalizedUnit) &&
    VOLUME_WORD[normalizedUnit]
  );
}

function matchToWeight(unit) {
  let normalizedUnit = trim(_.toLower(unit));
  if (_.last(normalizedUnit) === 's') {
    normalizedUnit = normalizedUnit.slice(-1);
  }

  return (
    _.includes(_.keys(WEIGHT_WORD), normalizedUnit) &&
    WEIGHT_WORD[normalizedUnit]
  );
}

function findIngredientUnit({
  ingredient,
  tagged: { unit, name, comment, other, input },
}) {
  const commentWords = _.split(unit, ' ');
  const otherWords = _.split(unit, ' ');

  const ingredientUnits = _.filter(
    SCRAPER_INGREDIENT_UNIT_MAPPING[ingredient.id],
    ({ hide }) => !hide
  );

  // handle weight units
  const matchedWeightWord = matchToWeight(unit);
  if (matchedWeightWord) {
    return {
      type: UNIT_TYPE.weight,
      unitWord: matchedWeightWord,
      display: matchedWeightWord,
    };
  }

  // handle volume units
  const matchedVolumeWord = matchToVolume(unit);
  if (matchedVolumeWord) {
    const volumeUnits = _.filter(
      ingredientUnits,
      ({ type }) => type === UNIT_TYPE.volume
    );

    // TODO: think about this matching process and improve it - maybe prioritize
    // equality over includes, partial word matches, etc.
    const matchedVolumeUnit =
      _.find(volumeUnits, ({ match }) => _.includes(name, match)) ||
      _.find(volumeUnits, ({ rawMatch }) => _.includes(input, rawMatch)) ||
      _.find(volumeUnits, ({ match }) => _.includes(comment, match)) ||
      _.find(volumeUnits, ({ match }) => _.includes(unit, match)) ||
      _.first(volumeUnits);
    if (!matchedVolumeUnit) {
      return false;
    }
    const { id, annotations } = matchedVolumeUnit;

    return {
      id,
      type: UNIT_TYPE.volume,
      unitWord: matchedVolumeWord,
      display: annotations
        ? `${matchedVolumeWord} (${annotations})`
        : matchedVolumeWord,
    };
  }

  // handle custom units
  // TODO: think about this matching process and improve it - maybe prioritize
  // equality over includes, partial word matches, etc.
  const customUnits = _.filter(
    ingredientUnits,
    ({ type }) => type === UNIT_TYPE.custom
  );
  const matchedCustomUnit =
    _.find(customUnits, ({ match }) => _.includes(unit, match)) ||
    _.find(customUnits, ({ rawMatch }) => _.includes(input, rawMatch)) ||
    _.find(
      customUnits,
      ({ match }) => _.difference(commentWords, _.split(match, ' ')) === []
    ) ||
    _.find(
      customUnits,
      ({ match }) => _.difference(otherWords, _.split(match, ' ')) === []
    );
  if (matchedCustomUnit) {
    const { id, display, annotations } = matchedCustomUnit;
    return {
      id,
      type: UNIT_TYPE.custom,
      unitWord: display,
      display: annotations ? `${display} (${annotations})` : display,
    };
  }

  // handle each units
  if (_.isNil(unit)) {
    const eachUnits = _.filter(
      ingredientUnits,
      ({ type }) => type === UNIT_TYPE.each
    );
    const matchedEachUnit =
      _.find(eachUnits, ({ match }) => _.includes(name, match)) ||
      _.find(eachUnits, ({ rawMatch }) => _.includes(input, rawMatch)) ||
      _.find(eachUnits, ({ match }) => _.includes(comment, match)) ||
      _.find(eachUnits, ({ match }) => _.includes(other, match)) ||
      _.first(eachUnits);

    if (!matchedEachUnit) {
      return false;
    }

    const { id, display, annotations } = matchedEachUnit;

    return {
      id,
      type: UNIT_TYPE.each,
      unitWord: display,
      display: annotations ? `${display} (${annotations})` : display,
    };
  }

  // loose matching on custom units as a last ditch effort
  const looseMatchedCustomUnit =
    _.find(customUnits, ({ match }) => _.includes(comment, match)) ||
    _.find(customUnits, ({ match }) => _.includes(other, match));
  if (matchedCustomUnit) {
    const { id, display, annotations } = looseMatchedCustomUnit;
    return {
      id,
      type: UNIT_TYPE.custom,
      unitWord: display,
      display: annotations ? `${display} (${annotations})` : display,
    };
  }

  return false;
}

function parseQuantity(quantity) {
  // deal with fractions
  if (_.includes(quantity, '/')) {
    if (_.includes(quantity, ' ')) {
      const [whole, fraction] = quantity.split(' ');
      const [numerator, denominator] = fraction.split('/');
      return (
        parseInt(whole, 10) +
        parseInt(numerator, 10) / parseInt(denominator, 10)
      );
    }
    const [numerator, denominator] = quantity.split('/');

    return parseInt(numerator, 10) / parseInt(denominator, 10);
  }

  return parseFloat(quantity);
}

// TODO: make use of display information
// (e.g. things tagged as other before the name may be useful for identifying the unit, but not things after)
function matchIngredient(taggedIngredient) {
  const ingredient = findIngredient(taggedIngredient);

  const quantity =
    taggedIngredient.qty === '' ? false : parseQuantity(taggedIngredient.qty);

  const ingredientUnit = findIngredientUnit({
    ingredient,
    tagged: taggedIngredient,
  });

  return {
    quantity,
    unit: ingredientUnit,
    ingredient,
  };
}

export default function matchIngredients(ingredients) {
  return _.map(ingredients, ingredient => {
    return matchIngredient(ingredient);
  });
}
