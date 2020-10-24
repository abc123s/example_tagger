import _ from 'lodash';
import { TrainingExample } from '../sequelize/models';
import matchIngredients from './matchIngredients';

TrainingExample.findAll()
  .then(trainingExamples => {
    const updates = [];
    _.forEach(
      _.filter(trainingExamples, ({ tags }) => tags),
      trainingExample => {
        const groupedTokens = {
          qty: [],
          unit: [],
          name: [],
          comment: [],
          other: [],
        };

        const tokenTypeStarts = {
          qty: 0,
          unit: 0,
          name: 0,
          comment: 0,
          other: 0,
        };

        _.forEach(
          _.zip(trainingExample.tokens, trainingExample.tags),
          ([token, tag]) => {
            let type = _.toLower(tag);
            let loc = 'i';
            if (type !== 'other') {
              loc = _.toLower(tag[0]);
              type = _.toLower(tag.slice(2));
            }

            // for now, only pay attention to first instance
            // of each tag type phrase
            if (tokenTypeStarts[type] < 2) {
              if (loc === 'b') {
                tokenTypeStarts[type] += 1;
                if (tokenTypeStarts[type] < 2) {
                  groupedTokens[type].unshift(token);
                }
              } else {
                groupedTokens[type].push(token);
              }
            }
          }
        );

        const taggedExample = {
          input: trainingExample.original,
          unit: groupedTokens.unit.join(' '),
          name: groupedTokens.name.join(' '),
          comment: groupedTokens.comment.join(' '),
          other: groupedTokens.other.join(' '),
        };

        // special handling for quantity tokens to reform fractions
        const quantityTokens = groupedTokens.qty;
        let qty = '';
        _.forEach(groupedTokens.qty, (token, tokenIndex) => {
          const nextToken = quantityTokens[tokenIndex + 1];

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
      }
    );

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
