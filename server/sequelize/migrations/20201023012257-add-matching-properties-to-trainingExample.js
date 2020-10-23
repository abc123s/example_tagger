module.exports = {
  up: (queryInterface, Sequelize) =>
    Promise.all([
      queryInterface.addColumn('TrainingExamples', 'ingredients', {
        type: Sequelize.JSON,
        defaultValue: null,
      }),
      queryInterface.addColumn('TrainingExamples', 'matchGuess', {
        type: Sequelize.JSON,
        defaultValue: null,
      }),
      queryInterface.addColumn('TrainingExamples', 'matchEscalated', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
    ]),
  down: queryInterface =>
    Promise.all([
      queryInterface.removeColumn('TrainingExamples', 'ingredients'),
      queryInterface.removeColumn('TrainingExamples', 'matchGuess'),
      queryInterface.removeColumn('TrainingExamples', 'matchEscalated'),
    ]),
};
