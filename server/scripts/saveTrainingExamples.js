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
  const escalatedExamples = _.filter(taggedExamples, 'escalated');
  console.log(
    `Saving ${taggedExamples.length} examples, ${
      escalatedExamples.length
    } escalated.`
  );

  const cleanTaggedExamples = _.map(taggedExamples, example => [
    example.original,
    example.tags,
  ]);

  const shuffledTaggedExamples = _.shuffle(cleanTaggedExamples);

  const devExamples = shuffledTaggedExamples.slice(0, 1000);
  const trainExamples = shuffledTaggedExamples.slice(1000, 3000);

  fs.writeFileSync(
    'devManuallyTaggedTrainingExamples.json',
    JSON.stringify(devExamples, null, 4)
  );

  fs.writeFileSync(
    'trainManualTrainingExamples.json',
    JSON.stringify(trainExamples, null, 4)
  );
});
