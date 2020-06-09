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

  const cleanTaggedExamples = _.map(taggedExamples, example =>
    _.pick(example, ['original', 'tags'])
  );

  fs.writeFileSync(
    'taggedTrainingExamples.json',
    JSON.stringify(cleanTaggedExamples.slice(0, 3000), null, 4)
  );
});
