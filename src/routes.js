const express = require('express')
const bodyParser = require('body-parser')
const swaggerUi = require('swagger-ui-express')

const {
  addCats,
  deleteCatByName,
  getCatById,
  searchCatsByParams,
  searchCatsByNamePattern,
  saveCatDescription,
  getCatValidationRules,
  uploadCatImage,
  getCatImages,
  getAllCats,
  getAppVersion,
  setLike,
  deleteLike,
  setDislike,
  deleteDislike,
  getLikesRating,
  getDislikesRating,
  getCatsColorsAndCharacters,
} = require('./cats-controller')
const { swaggerSpec } = require('./swagger-controller')
const { serverPort } = require('./configs')
const { upload } = require('./multer')
const { expressPino } = require('./logger')

const app = express()

app.use(expressPino)
app.use(bodyParser.json())
app.use('/photos', express.static('./public/photos'))

/**
 * Документация по описанию swagger:
 * https://swagger.io/docs/specification/about/
 */

/**
 * @swagger
 *
 * definitions:
 *   GenderEnum:
 *     type: string
 *     required: true
 *     description: Пол кота
 *     enum: [male, female, unisex]
 *   Cat:
 *     type: object
 *     properties:
 *       id:
 *         type: number
 *         required: true
 *       name:
 *         type: string
 *         description: Имя кота
 *         required: true
 *       description:
 *         type: string
 *         description: Описание имени кота
 *       tags:
 *         type: array
 *         items:
 *           type: string
 *       gender:
 *         $ref: '#/definitions/GenderEnum'
 *       likes:
 *         type: number
 *         description: Количество лайков у имени
 *         required: true
 *
 *   Groups:
 *     type: object
 *     properties:
 *       groups:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *               description: Заголовок группы имён (первая буква имени)
 *               required: true
 *             count:
 *               type: number
 *               description: Количество имён в группе
 *               required: true
 *             cats:
 *               type: array
 *               required: true
 *               items:
 *                 $ref: '#/definitions/Cat'
 */

/**
 * @swagger
 *
 * /cats/add:
 *   post:
 *     description: Добавление списка имен
 *     produces:
 *       - application/json
 *     requestBody:
 *       description: Список с именами и полом
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       description: Имя кота
 *                       type: string
 *                       required: true
 *                     gender:
 *                       $ref: '#/definitions/GenderEnum'
 *                     description:
 *                       description: Описание кота
 *                       type: string
 *     responses:
 *       200:
 *         description: Список добавленных котов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cats:
 *                   type: array
 *                   items:
 *                     $ref: '#/definitions/Cat'
 */
app.post('/cats/add', addCats)

/**
 * @swagger
 *
 * /cats/get-by-id:
 *   get:
 *     description: Получение кота по id
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: Id кота
 *     responses:
 *       200:
 *         description: Объект кота
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cat:
 *                   $ref: '#/definitions/Cat'
 */
app.get('/cats/get-by-id', getCatById)

/**
 * @swagger
 *
 * /cats/search:
 *   post:
 *     description: Поиск по имени и доп.характеристикам
 *     produces:
 *       - application/json
 *     requestBody:
 *       description: Фильтр поиска имени
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 description: Имя кота
 *                 type: string
 *                 required: true
 *               gender:
 *                 $ref: '#/definitions/GenderEnum'
 *     responses:
 *       200:
 *         description: Имена по группам алфавита с их количеством
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Groups'
 */
app.post('/cats/search', searchCatsByParams)

/**
 * @swagger
 *
 * /cats/search-pattern:
 *   get:
 *     description: Поиск по части начала имени
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Часть начала имени
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Ограничение вывода количества имен
 *     responses:
 *       200:
 *         description: список имен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Cat'
 */
app.get('/cats/search-pattern', searchCatsByNamePattern)

/**
 * @swagger
 *
 * /cats/save-description:
 *   post:
 *     description: Сохранение описания имени
 *     produces:
 *       - application/json
 *     requestBody:
 *       description: Фильтр поиска имени
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               catId:
 *                 description: id кота
 *                 type: number
 *                 required: true
 *               catDescription:
 *                 description: Описание имени
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: Имена по группам алфавита с их количеством
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Cat'
 *
 */
app.post('/cats/save-description', saveCatDescription)

/**
 * @swagger
 *
 * /cats/validation:
 *   get:
 *     description: Получение правил валидации
 *     responses:
 *       200:
 *         description: список регулярных выражений
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                   description:
 *                     type: string
 *                   regex:
 *                     type: string
 */
app.get('/cats/validation', getCatValidationRules)

/**
 * @swagger
 *
 * /cats/all:
 *   get:
 *     description: Вывод списка всех котов
 *     parameters:
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         required: true
 *         description: Id кота
 *     responses:
 *       200:
 *         description: список имен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Groups'
 */
app.get('/cats/all', getAllCats)

/**
 * @swagger
 *
 * /cats/{catId}/upload:
 *   post:
 *     description: Добавление изображения кота
 *     parameters:
 *       - in: path
 *         name: catId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Id кота
 *     requestBody:
 *        content:
 *          multipart/form-data:
 *            schema:
 *              type: object
 *              properties:
 *                file:
 *                  type: string
 *                  format: binary
 *     responses:
 *       200:
 *         description: Имя загруженного изображения
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileUrl:
 *                   type: string
 */
app.post('/cats/:catId/upload', upload.single('file'), uploadCatImage)

/**
 * @swagger
 *
 * /cats/{catId}/photos:
 *   get:
 *     description: Получение изображений по id кота
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: catId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Id кота
 *     responses:
 *       200:
 *         description: список фотографий кота
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 */
app.get('/cats/:catId/photos', getCatImages)

/**
 * @swagger
 *
 * /version:
 *   get:
 *     description: Получение версии проекта
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: версия проекта
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 build:
 *                   type: number
 */
app.get('/version', getAppVersion)

/**
 * @swagger
 *
 * /cats/{catId}/like:
 *   post:
 *     description: Добавление лайка коту
 *     parameters:
 *       - in: path
 *         name: catId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Id кота
 *     responses:
 *       200:
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: OK
 */
app.post('/cats/:catId/like', setLike)

/**
 * @swagger
 *
 * /cats/{catId}/like:
 *   delete:
 *     description: Удаление лайка у кота
 *     parameters:
 *       - in: path
 *         name: catId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Id кота
 *     responses:
 *       200:
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: OK
 */
app.delete('/cats/:catId/like', deleteLike)

/**
 * @swagger
 *
 * /cats/{catId}/dislike:
 *   post:
 *     description: Добавление дизлайка коту
 *     parameters:
 *       - in: path
 *         name: catId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Id кота
 *     responses:
 *       200:
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: OK
 */
app.post('/cats/:catId/dislike', setDislike)

/**
 * @swagger
 *
 * /cats/{catId}/dislike:
 *   delete:
 *     description: Удаление дизлайка у кота
 *     parameters:
 *       - in: path
 *         name: catId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Id кота
 *     responses:
 *       200:
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: OK
 */
app.delete('/cats/:catId/dislike', deleteDislike)

/**
 * @swagger
 *
 * /cats/likes-rating:
 *   get:
 *     description: Получение списка ТОП-10 лайков
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: список имен с лайками
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     require: true
 *                   likes:
 *                     type: number
 *                     require: true
 */
app.get('/cats/likes-rating', getLikesRating)

/**
 * @swagger
 *
 * /cats/dislikes-rating:
 *   get:
 *     description: Получение списка ТОП-10 дизлайков
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: список имен с дизлайками
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     require: true
 *                   dislikes:
 *                     type: number
 *                     require: true
 */
app.get('/cats/dislikes-rating', getDislikesRating)
app.get('/cats/get_characteristics', getCatsColorsAndCharacters)


app.delete('/cats/delete-by-name', deleteCatByName)
app.use('/api-docs-ui', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.listen(serverPort)
