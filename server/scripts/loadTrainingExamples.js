import _ from 'lodash';
import { TrainingExample } from '../sequelize/models';

const fs = require('fs');

const rawExamples = fs.readFileSync('trainingExamples.json');
const examples = JSON.parse(rawExamples);

const creatingTrainingExamples = [];

_.forEach(examples, example => {
  creatingTrainingExamples.push(
    TrainingExample.create({
      ...example,
      tags: null,
      escalated: false,
    })
  );
});

Promise.all(creatingTrainingExamples).then(() => {
  console.log('created training examples');
});
