import _ from 'lodash';
import { TrainingExample } from '../sequelize/models';

const fs = require('fs');

const rawExamples = fs.readFileSync('trainingExamples.json');
const examples = JSON.parse(rawExamples);

let creatingTrainingExamples = Promise.resolve();
const batchedExamples = _.chunk(examples, 20);

_.forEach(batchedExamples, batch => {
  creatingTrainingExamples = creatingTrainingExamples.then(() => {
    return Promise.all(
      _.map(batch, example =>
        TrainingExample.create({
          ...example,
          tags: null,
          escalated: false,
        })
      )
    );
  });
});

creatingTrainingExamples.then(() => {
  console.log('created training examples');
});
