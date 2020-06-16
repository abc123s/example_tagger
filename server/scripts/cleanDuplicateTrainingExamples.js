import _ from 'lodash';
import { TrainingExample } from '../sequelize/models';

TrainingExample.findAll()
  .then(examples => {
    console.log('total examples:');
    console.log(examples.length);
    const groupedExamples = _.groupBy(
      examples,
      ({ source, original }) => `${source}-${original}`
    );

    const duplicatedExamples = _.pickBy(
      groupedExamples,
      exampleGroup => exampleGroup.length > 1
    );

    let duplicatedExampleCount = 0;
    const examplesToKeep = [];
    const examplesToDelete = [];
    _.forEach(duplicatedExamples, exampleGroup => {
      const exampleToKeep =
        _.find(exampleGroup, ({ tags }) => tags) ||
        _.sortBy(exampleGroup, 'id')[0];

      examplesToKeep.push(exampleToKeep);
      _.forEach(exampleGroup, example => {
        duplicatedExampleCount += 1;
        if (example !== exampleToKeep) {
          examplesToDelete.push(example);
        }
      });
    });
    console.log(`found ${duplicatedExampleCount} duplicate examples`);
    console.log(`deleting ${examplesToDelete.length} examples`);

    return Promise.all(
      _.map(examplesToDelete, exampleToDelete => exampleToDelete.destroy())
    );
  })
  .then(() => {
    console.log('done deleting');
  });
