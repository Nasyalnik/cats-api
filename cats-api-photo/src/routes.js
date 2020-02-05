const express = require('express');
const swaggerUi = require('swagger-ui-express');
const {upload} = require('./multer');
const {swaggerSpec} = require('./swagger-controller');
const catsStorage = require('./storage');
const boom = require('boom');

const app = express();

function isEmpty(value) {
  return value == null || value.length === 0;
}

app.get('/', function(req, res) {
  res.send('Hello World!');
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
    return res.status(400).json(boom.badRequest('File is required'));
  }

  catsStorage
      .uploadCatImage(req.file.filename, catId)
      .then(() => res.status(200).json({fileUrl: '/photos/' + req.file.filename}))
      .catch((err) => {
        res
            .status(500)
            .json(boom.internal('unable to insert db', err.stack || err.message));
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
    return res.status(400).json(boom.badRequest('Image id is absent'));
  }

  catsStorage
      .getCatImages(catId)
      .then((imageFound) => {
        if (imageFound == null) {
          return res.status(404).json(boom.notFound('Cat or photos not found'));
        }
        const images = (imageFound || []).map((obj) => '/photos/' + obj.link);

        return res.json({images: images});
      })
      .catch((err) =>
        res.status(500).json(boom.internal('unable to find image', err.stack || err.message)),
      );
});

app.use('/api-docs-ui', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports=app;
