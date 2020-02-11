const express = require('express');
const swaggerUi = require('swagger-ui-express');
const {upload} = require('./multer');
const {swaggerSpec} = require('./swagger-controller');
const catsStorage = require('./storage');
const boom = require('boom');
const {pool} = require('./storage')
const {logger} = require('./logger');

const app = express();

function isEmpty(value) {
  return value == null || value.length === 0;
}

app.use((err, req, res, next) => {
  logger.error(err.toString());
  next();
});

app.get('/status', (req, res) => {
  pool.query('SELECT version()')
    .then((row) => {
      logger.info({req: req, res: {status: 200, json: row.rows}});
      return res.status(200).json(row.rows);
    });
});

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
app.post('/cats/:catId/upload', upload.single('file'), (req, res) => {
  const {catId} = req.params;
  if (!req.file) {
    const jsonResponse = boom.badRequest('File is required');
    logger.error({req: req, res: {status: 400, json: jsonResponse}});
    return res.status(400).json(jsonResponse);
  }

  catsStorage
    .uploadCatImage(req.file.filename, catId)
    .then(() => {
      const jsonResponse = {fileUrl: '/photos/' + req.file.filename};
      logger.info({req: req, res: {status: 200, json: jsonResponse}});
      return res.status(200).json(jsonResponse);
    })
    .catch((err) => {
      const jsonResponse = boom.internal('unable to insert db', err.stack || err.message);
      logger.error({req: req, res: {status: 500, json: jsonResponse}});
      return res.status(500).json(jsonResponse);
    });
});

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
app.get('/cats/:catId/photos', (req, res) => {
  const {catId} = req.params;
  if (isEmpty(catId)) {
    const jsonResponse = boom.badRequest('Image id is absent');
    logger.error({req: req, res: {status: 400, json: jsonResponse}});
    return res.status(400).json(jsonResponse);
  }

  catsStorage
    .getCatImages(catId)
    .then((imageFound) => {
      if (imageFound == null) {
        const jsonResponse = boom.notFound('Cat or photos not found');
        logger.error({req: req, res: {status: 404, json: jsonResponse}});
        return res.status(404).json(jsonResponse);
      }
      const images = (imageFound || []).map((obj) => '/photos/' + obj.link);

      logger.info({req: req, res: {status: 200, json: {images: images}}});
      return res.status(200).json({images: images});
    })
    .catch((err) =>{
      const jsonResponse = boom.internal('Unable to find image', err.stack || err.message);
      logger.error({req: req, res: {status: 500, json: jsonResponse}});

      return res.status(500).json(jsonResponse);
    });
});

app.use('/api-docs-ui', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('*', (req, res)=>{
  logger.error({req: req, res: {status: 404, message: 'Not found'}});
  res.status(404).send('Not found');
});

module.exports=app;
