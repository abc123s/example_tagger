import _ from 'lodash';
import { TrainingExample } from '../sequelize/models';
import matchIngredients from './matchIngredients';

TrainingExample.findAll()
  .then(trainingExamples => {
    const updates = [];
    _.forEach(trainingExamples, trainingExample => {
      const groupedTokens = _.groupBy(
        _.zip(trainingExample.tokens, trainingExample.tags),
        ([, tag]) => tag
      );

      const taggedExample = {
        input: trainingExample.original,
      };
      _.forEach(['name', 'unit', 'comment'], tag => {
        const prefix = _.map(
          groupedTokens[`B-${_.toUpper(tag)}`],
          ([token]) => token
        ).join(' ');
        const suffix = _.map(
          groupedTokens[`I-${_.toUpper(tag)}`],
          ([token]) => token
        ).join(' ');

        taggedExample[tag] = prefix + (prefix && suffix ? ' ' : '') + suffix;
      });

      taggedExample.other = _.map(groupedTokens.OTHER, ([token]) => token).join(
        ' '
      );

      // special handling for quantity tokens to reform fractions
      const quantityTokens = [
        ...(groupedTokens['B-QTY'] || []),
        ...(groupedTokens['I-QTY'] || []),
      ];
      let qty = '';
      _.forEach(quantityTokens, ([token], tokenIndex) => {
        const nextToken =
          quantityTokens[tokenIndex + 1] && quantityTokens[tokenIndex + 1][0];

        const tokenIsNumber = _.toString(_.toInteger(token)) === token;
        const nextTokenIsNumber =
          _.toString(_.toInteger(nextToken)) === nextToken;
        if (
          (tokenIsNumber && _.includes(['/', '.'], nextToken)) ||
          (_.includes(['/', '.'], token) && nextTokenIsNumber) ||
          !nextToken
        ) {
          qty += token;
        } else {
          qty += `${token} `;
        }
      });
      taggedExample.qty = qty;

      const matchGuess = matchIngredients([taggedExample]);
      updates.push(() =>
        trainingExample.update({
          matchGuess,
        })
      );
    });

    const batchedUpdates = _.chunk(updates, 50);

    let serializedBatchedUpdates = Promise.resolve();
    let batch = 0;
    _.forEach(batchedUpdates, batchedUpdate => {
      serializedBatchedUpdates = serializedBatchedUpdates.then(() => {
        batch += 1;
        console.log('Working on batch: ', batch);
        return Promise.all(_.map(batchedUpdate, update => update()));
      });
    });

    return serializedBatchedUpdates;
  })
  .then(() => {
    console.log('made guesses for all training examples');
  });
