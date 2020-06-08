module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('TrainingExamples', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      source: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      original: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      tokens: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      guess: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      tags: {
        type: Sequelize.JSON,
        defaultValue: null,
      },
      escalated: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    }),
  down: queryInterface => queryInterface.dropTable('TrainingExamples'),
};
