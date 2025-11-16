import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chhattisgarh Shadi API',
      version: '1.0.0',
      description: 'Matrimony platform API for Chhattisgarh region',
      contact: {
        name: 'API Support',
        email: 'support@chhattisgarhshaadi.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://chhattisgarhshadi-backend.onrender.com'
          : 'http://localhost:8080',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // Path to API docs
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
