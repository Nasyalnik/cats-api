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
} = require('./cats-controller')
const { swaggerSpec } = require('./swagger-controller')
const { serverPort } = require('./configs')
const { upload } = require('./multer')

const pino = require('pino')()
const expressPino = require('express-pino-logger')({
  logger: pino
})

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
 *     enum: [male, female, unisex]
 *   Cat:
 *     type: object
 *     properties:
 *       id:
 *         type: number
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       tags:
 *         type: array
 *         items:
 *           type: string
 *       gender:
 *         $ref: '#/definitions/GenderEnum'
 *       likes:
 *         type: number
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
 *             count:
 *               type: number
 *             cats:
 *               type: array
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
 *                       description: Пол кота
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
 *               genders:
 *                 description: Пол кота
 *                 type: array
 *                 items:
 *                   $ref: '#/definitions/GenderEnum'
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
 * /cats/{id}/upload:
 *   post:
 *     description: Добавление изображения кота
 *     parameters:
 *       - in: path
 *         name: id
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
app.post('/cats/:id/upload', upload.single('file'), uploadCatImage)

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

app.delete('/cats/delete-by-name', deleteCatByName)
app.use('/api-docs-ui', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.listen(serverPort)
