/**
 * Swagger API Documentation Configuration
 * Auto-generates API documentation from route comments
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Chhattisgarh Shaadi API',
            version: '1.0.0',
            description: 'Matrimony Application API for Chhattisgarh region',
            contact: {
                name: 'API Support',
                email: 'support@chhattisgarhshaadi.com',
            },
        },
        servers: [
            {
                url: config.API_URL || 'http://localhost:3000/api/v1',
                description: 'API Server',
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
            schemas: {
                // Common response schemas
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: { type: 'object' },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' },
                        error: { type: 'string' },
                    },
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 20 },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                    },
                },
                // User schemas
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' },
                        role: { type: 'string', enum: ['USER', 'PREMIUM_USER', 'ADMIN'] },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Profile: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        profileId: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
                        dateOfBirth: { type: 'string', format: 'date' },
                        religion: { type: 'string' },
                        caste: { type: 'string' },
                        city: { type: 'string' },
                        state: { type: 'string' },
                    },
                },
                // Auth schemas
                LoginRequest: {
                    type: 'object',
                    required: ['idToken'],
                    properties: {
                        idToken: { type: 'string', description: 'Google OAuth ID token' },
                    },
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                user: { $ref: '#/components/schemas/User' },
                                accessToken: { type: 'string' },
                                refreshToken: { type: 'string' },
                            },
                        },
                    },
                },
                // Subscription schemas
                SubscriptionPlan: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        price: { type: 'number' },
                        duration: { type: 'integer', description: 'Days' },
                        features: { type: 'array', items: { type: 'string' } },
                    },
                },
            },
        },
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Users', description: 'User management' },
            { name: 'Profiles', description: 'Profile management' },
            { name: 'Matches', description: 'Match and interest management' },
            { name: 'Messages', description: 'Chat and messaging' },
            { name: 'Subscriptions', description: 'Subscription and payments' },
            { name: 'Notifications', description: 'Push notifications' },
            { name: 'Admin', description: 'Admin operations' },
        ],
    },
    apis: ['./src/routes/*.js'], // Path to route files with JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger documentation
 * @param {Express} app - Express application
 */
export const setupSwagger = (app) => {
    // Swagger JSON endpoint
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Chhattisgarh Shaadi API Docs',
    }));

    console.log('📚 Swagger docs available at /api-docs');
};

export default { setupSwagger, swaggerSpec };
