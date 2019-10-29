const { Pool } = require('pg')
const { pgUser, pgPass, pgDb, pgHost } = require('./configs.js')
const { logger } = require('./logger')

const pool = new Pool({
  user: pgUser,
  database: pgDb,
  password: pgPass,
  host: pgHost,
})

pool.on('error', err => {
  console.error('Ошибка БД', err)
  process.exit(-1)
})

/**
 * Добавляем котов в БД
 */
function addCats(cats) {
  const inserts = []

  for (let i = 0; i < cats.length; i++) {
    const { name, description, gender } = cats[i]

    const insert = pool
      .query(
        'INSERT INTO Cats(name, description, gender) VALUES ($1, $2, $3) RETURNING *',
        [name, description, gender],
      )
      .then(insertResult => insertResult.rows[0])

    inserts.push(insert)
  }

  return Promise.all(inserts)
}

/**
 * Возвращаем всех котов
 */
function allCats(gender) {
  const queryAll = 'SELECT * FROM Cats ORDER BY LOWER(name)'
  const queryWithGender = `SELECT * FROM Cats WHERE gender = '${gender}' ORDER BY LOWER(name)`

  return pool
    .query(gender ? queryWithGender : queryAll)
    .then(selectResult => selectResult.rows)
}

/**
 * Поиск котов по указанным параметрам в БД
 * @param {*} searchParams - список параметров для поиска, переданные от клиента (имя, пол (м,ж, унисекс))
 */
function findCatsByParams(searchParams) {
  const catName = searchParams.name
  const genderFilter = searchParams.gender ? ` AND gender = '${searchParams.gender}'` : ''

  logger.info(`searching cats by name: ${catName} and gender: ${searchParams.gender}`)

  return pool
    .query(
      `SELECT * FROM Cats WHERE name ILIKE $1${genderFilter} ORDER BY LOWER(name)`,
      [`%${catName}%`],
    )
    .then(selectResult => selectResult.rows)
}

function findCatById(catId) {
  return pool
    .query('SELECT * FROM Cats WHERE id = $1', [catId])
    .then(selectResult => {
      if (selectResult.rows.length == 0) {
        return null
      }

      return selectResult.rows[0]
    })
}

function findCatByNamePattern(catName, limit) {
  limit = Number(limit)

  const limitQuery = limit > 0
    ? ` LIMIT ${limit}`
    : ''

  return pool
    .query(
      `SELECT * FROM Cats WHERE LOWER(name) LIKE LOWER ($1) ORDER BY id ASC${limitQuery}`,
      [catName + '%'],
    )
    .then(selectResult => {
      if (selectResult.rows.length == 0) {
        return null
      }

      return selectResult.rows
    })
}

/**
 * Сохранение описания кота в БД
 * @param {*} catId - идентификатор кота, отправленный клиентом
 * @param {*} catDescription - описание кота
 */
function saveCatDescription(catId, catDescription) {
  return pool
    .query('UPDATE Cats SET description = $1 WHERE id = $2 RETURNING *', [
      catDescription,
      catId,
    ])
    .then(updateResult => {
      if (updateResult.rows.length == 0) {
        return null
      }

      return updateResult.rows[0]
    })
}

/**
 * Поиск правил валидации в БД
 */
function findCatsValidationRules() {
  return pool
    .query('SELECT * FROM Cats_Validations WHERE type = $1', ['search'])
    .then(selectResult => selectResult.rows)
}

/**
 * Поиск правил валидации в БД для добавляемых имен
 */
function findAddingCatsValidationRules() {
  return pool
    .query('SELECT * FROM Cats_Validations WHERE type = $1', ['add'])
    .then(selectResult => selectResult.rows)
}

/**
 * Добавление изображения в БД
 */
function uploadCatImage(image_link, cat_id) {

  return pool
    .query(
      'INSERT INTO Images (link, id_cat) VALUES ($1, $2) RETURNING *', [image_link, cat_id])
    .then(insertResult => insertResult.rows[0])
}

/**
 * Получение изображений кота
 */
function getCatImages(catId) {
  return pool
    .query('SELECT Link FROM Images WHERE id_cat = $1', [catId])
    .then(selectResult => {
      if (selectResult.rows.length == 0) {
        return null
      }

      return selectResult.rows
    })
}

/**
 * Добавление лайка коту
 * @param catId
 * @returns {*|query|void|Promise<PermissionStatus>}
 */
function plusLike(catId) {
  return pool.query('UPDATE Cats SET likes = likes + 1 WHERE id = $1', [catId])
}

/**
 * Удаление лайка коту
 * @param catId
 * @returns {*|query|void|Promise<PermissionStatus>}
 */
function minusLike(catId) {
  return pool.query('UPDATE Cats SET likes = likes - 1 WHERE id = $1', [catId])
}

/**
 * Добавление дизлайка коту
 * @param catId
 * @returns {*|query|void|Promise<PermissionStatus>}
 */
function plusDislike(catId) {
  return pool.query('UPDATE Cats SET dislikes = dislikes + 1 WHERE id = $1', [catId])
}

/**
 * Удаление дизлайка коту
 * @param catId
 * @returns {*|query|void|Promise<PermissionStatus>}
 */
function minusDislike(catId) {
  return pool.query('UPDATE Cats SET dislikes = dislikes - 1 WHERE id = $1', [catId])
}

/**
 * Список котов с наибольшим количеством лайков
 * @param limit
 * @returns {*|query|void|Promise<PermissionStatus>}
 */
function getLikesRating(limit = 10) {
  limit = Number(limit) || 10;

  return pool.query(`SELECT name, likes FROM cats ORDER BY likes DESC, LOWER(name) LIMIT ${limit}`)
}

/**
 * Список котов с наибольшим количеством дизлайков
 * @param limit
 * @returns {*|query|void|Promise<PermissionStatus>}
 */
function getDislikesRating(limit = 10) {
  limit = Number(limit) || 10;

  return pool.query(`SELECT name, dislikes FROM cats ORDER BY dislikes DESC, LOWER(name) LIMIT ${limit}`)
}

/**
 * Получение человеческой ошибки от БД по коду
 * @param {string} errCode
 * @returns {string|null}
 */
function getErrorText(errCode) {
  switch (errCode) {
    case '23505':
      return `Такое значение уже существует`;
    default:
      return null;
  }
}

/**
 * Получение всех окрасов
 */
function getCatsColors() {
  return pool
    .query('SELECT * FROM cats_colors')
    .then(selectResult => selectResult.rows)
}

/**
 * Получение всех характеров
 */
function getCatsCharacters() {
  return pool
    .query('SELECT * FROM cats_characters')
    .then(selectResult => selectResult.rows)
}

/**
 * Сохранение окраса кота в БД
 * @param {*} catId - идентификатор кота, отправленный клиентом
 * @param {*} id_color - идентификатор окраса
 */
function saveCatColor(catId, id_color) {
  return pool
    .query('INSERT INTO colors_ids (id_cat, id_color) VALUES ($1, $2) RETURNING *', [
      catId,
      id_color,
    ])
    .then(updateResult => {
      // if (updateResult.rows.length == 0) {
      //   return null
      // }

      return updateResult.rows[0]
    })
}

/**
 * Сохранение характера кота в БД
 * @param {*} catId - идентификатор кота, отправленный клиентом
 * @param {*} id_character - идентификатор характера
 */
function saveCatCharacter(catId, id_character)
{
    let result = []
    const query = 'INSERT INTO characters_ids (id_cat, id_character) VALUES '

  for(let i = 0; i < id_character.length; i++) {
    result.push('($1, ' + '$' + String(i + 2) + ')')
    }

      return pool.query(
        query + result.join(','),
        [catId, ...id_character]
      )
}

/**
 * Удаление цвета кота
 * @param {*} catId - идентификатор кота, отправленный клиентом
 */
function deleteCatColor(catId) {
  return pool
    .query('DELETE FROM colors_ids WHERE id_cat = $1', [
      catId,
    ])
    .then(() => {})
}

/**
 * Удаление характера кота
 * @param {*} catId - идентификатор кота, отправленный клиентом
 */
function deleteCatCharacter(catId) {
  return pool
    .query('DELETE FROM characters_ids WHERE id_cat = $1', [
      catId,
    ])
    .then(() => {})
}


module.exports = {
  addCats,
  findCatsByParams,
  findCatByNamePattern,
  findCatById,
  saveCatDescription,
  findCatsValidationRules,
  findAddingCatsValidationRules,
  uploadCatImage,
  getCatImages,
  allCats,
  plusLike,
  minusLike,
  plusDislike,
  minusDislike,
  getLikesRating,
  getDislikesRating,
  getErrorText,
  getCatsCharacters,
  getCatsColors,
  saveCatColor,
  saveCatCharacter,
  deleteCatColor,
  deleteCatCharacter,
}
