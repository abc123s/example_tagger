module.exports = (sequelize, DataTypes) => {
  const TrainingExample = sequelize.define('TrainingExample', {
    source: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    original: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tokens: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    guess: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: null,
    },
    escalated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });

  // associations can be defined here
  TrainingExample.associate = () => {};

  return TrainingExample;
};
