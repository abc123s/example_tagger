import _ from 'lodash';
import { Op } from 'sequelize';

import { TrainingExample } from '../sequelize/models';

const fs = require('fs');

TrainingExample.findAll({
  where: {
    tags: {
      [Op.ne]: null,
    },
  },
}).then(taggedExamples => {
  let correctTags = 0;
  let totalTags = 0;
  let correctSentences = 0;
  let totalSentences = 0;
  _.forEach(taggedExamples, ({ guess, tags }) => {
    totalSentences += 1;
    if (_.isEqual(guess, tags)) {
      correctSentences += 1;
    }

    _.forEach(guess, (guessLabel, index) => {
      totalTags += 1;
      const correctLabel = tags[index];
      if (correctLabel === guessLabel) {
        correctTags += 1;
      }
    });
  });

  console.log('Tag-level accuracy:');
  console.log(correctTags);
  console.log(totalTags);
  console.log(correctTags / totalTags);

  console.log('Sentence-level accuracy:');
  console.log(correctSentences);
  console.log(totalSentences);
  console.log(correctSentences / totalSentences);
});
