const path = require('path');
const dotenv = require('dotenv');

const configLoadResult = dotenv.config({
  path: path.join(
      __dirname,
      '..',
      'configs',
      `${process.env.NODE_ENV}.env`),
});

if (configLoadResult.error) {
  console.error(`Cannot read config file: ${configLoadResult.error}`);
  process.exit(1);
}

const serverPort = process.env.NODE_PORT;
const pgUser = process.env.POSTGRES_USER;
const pgPass = process.env.POSTGRES_PASSWORD;
const pgDb = process.env.POSTGRES_DB;
const pgHost = process.env.POSTGRES_HOST;
const pgPort = process.env.POSTGRES_PORT;
const pathSaveFile = process.env.PATH_SAVE_FILE;

module.exports = {
  serverPort,
  pgUser,
  pgPass,
  pgDb,
  pgHost,
  pgPort,
  pathSaveFile,
};
