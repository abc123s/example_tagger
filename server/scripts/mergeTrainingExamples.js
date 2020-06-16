import _ from 'lodash';
import { TrainingExample } from '../sequelize/models';

const fs = require('fs');

const rawExamples = fs.readFileSync('trainingExamples_v2.json');
const examples = JSON.parse(rawExamples);

TrainingExample.findAll()
  .then(dbTrainingExamples => {
    const dbExamplesToReview = [];
    const updatesToMake = [];
    _.forEach(examples, example => {
      const matchingDbExample = _.find(
        dbTrainingExamples,
        ({ id, source, original }) => {
          return (
            source === example.source &&
            original === example.original &&
            !_.some(updatesToMake, ({ id: updatedId }) => updatedId === id)
          );
        }
      );

      if (matchingDbExample) {
        updatesToMake.push({
          example: matchingDbExample,
          updates: {
            tokens: example.tokens,
            guess: example.guess,
          },
        });

        if (
          !_.isEqual(matchingDbExample.tokens, example.tokens) &&
          matchingDbExample.tags
        ) {
          dbExamplesToReview.push(matchingDbExample);
        }
      }
    });

    console.log(`${dbExamplesToReview.length} examples to review`);

    fs.writeFileSync(
      'dbExamplesToReview.json',
      JSON.stringify(_.sortBy(_.map(dbExamplesToReview, 'id')), null, 4)
    );
    let updatingTrainingExamples = Promise.resolve();
    const batchedUpdates = _.chunk(updatesToMake, 20);

    _.forEach(batchedUpdates, batch => {
      updatingTrainingExamples = updatingTrainingExamples.then(() => {
        return Promise.all(
          _.map(batch, ({ example, updates }) =>
            example.update({
              ...updates,
            })
          )
        );
      });
    });

    return updatingTrainingExamples;
  })
  .then(() => {
    console.log('updated training examples');
  });
