import fs from 'fs';
import path from 'path';
import pg from 'pg';
import Sequelize from 'sequelize';
import configVars from '../../config/config';

const configOptions = require('./../config/config.json');

const env = process.env.NODE_ENV || 'development';
let config = configOptions[env];

const basename = path.basename(__filename);
const db = {};

// make sure BIGINTS are returned as numbers by sequelize
pg.defaults.parseInt8 = true;

// production access locally
if (env !== 'production' && !configVars.get('DEBUG')) {
  config = configOptions.local_production;
}
const sequelize = new Sequelize(process.env[config.use_env_variable], config);

fs.readdirSync(__dirname)
  .filter(
    file =>
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
  )
  .forEach(file => {
    const model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
