const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cats API Photo',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerSpec,
};
