import _ from 'lodash';
import { TrainingExample } from '../sequelize/models';

TrainingExample.findAll()
  .then(trainingExamples => {
    const updates = [];
    _.forEach(
      _.filter(trainingExamples, ({ tags }) => tags),
      trainingExample => {
        updates.push(() => {
          const exampleUpdates = {
            matchGuess: _.map(trainingExample.matchGuess, guess => ({
              ...guess,
              notExact: false,
            })),
          };

          if (trainingExample.ingredients) {
            exampleUpdates.ingredients = _.map(
              trainingExample.ingredients,
              ingredient => ({
                ...ingredient,
                notExact: false,
              })
            );
          }

          trainingExample.update(exampleUpdates);
        });
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
    console.log('Added not exact to all training examples');
  });
