import _ from 'lodash';
import { Op } from 'sequelize';

import { TrainingExample } from '../sequelize/models';

const fs = require('fs');

TrainingExample.findAll({
  where: {
    ingredients: {
      [Op.ne]: null,
    },
  },
}).then(matchedExamples => {
  // filter out examples that don't include any ingredients
  // also ignore examples with multiple ingredients for now
  const cleanExamples = _.filter(matchedExamples, example => {
    return example.ingredients.length == 1;
  });

  console.log(
    `Saving ${cleanExamples.length} clean single-ingredient examples`
  );

  const shuffledExamples = _.shuffle(cleanExamples);

  const devExamples = shuffledExamples.slice(0, 1000);
  const trainExamples = shuffledExamples.slice(1000);

  fs.writeFileSync(
    'devMatchedTrainingExamples.json',
    JSON.stringify(devExamples, null, 4)
  );

  fs.writeFileSync(
    'trainMatchedTrainingExamples.json',
    JSON.stringify(trainExamples, null, 4)
  );
});
