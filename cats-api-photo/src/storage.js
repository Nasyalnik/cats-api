const {Pool} = require('pg');
const {pgUser, pgPass, pgDb, pgHost, pgPort} = require('./configs.js');

const pool = new Pool({
  user: pgUser,
  database: pgDb,
  password: pgPass,
  host: pgHost,
  port: pgPort,
});

pool.on('error', (err) => {
  console.error('Error database', err);
  process.exit(-1);
});

/**
 * Получение изображений кота
 */
function getCatImages(catId) {
  return pool
      .query('SELECT Link FROM Images WHERE id_cat = $1', [catId])
      .then((selectResult) => {
        if (selectResult.rows.length === 0) {
          return null;
        }

        return selectResult.rows;
      });
}

/**
 * Add an image to the database
 */
function uploadCatImage(imageLink, catId) {
  return pool
      .query(
          'INSERT INTO Images (link, id_cat) VALUES ($1, $2) RETURNING *',
          [imageLink, catId])
      .then((insertResult) => insertResult.rows[0]);
}

module.exports = {
  uploadCatImage,
  getCatImages,
  pool,
};
